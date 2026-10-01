import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { BufferJSON, initAuthCreds, proto, useMultiFileAuthState } from "@whiskeysockets/baileys";

const { Pool } = pg;
const fsp = fs.promises;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pastikan DATABASE_URL termuat dari worker/.env atau root .env
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

let poolInstance = null;

export function getDbPool() {
  if (!poolInstance && process.env.DATABASE_URL) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });

    poolInstance.on("error", (err) => {
      // Supabase pooler (PgBouncer) idle disconnects (e.g. ECONNRESET) are normal and self-healing.
      // Handling this prevents unhandled exception from crashing the daemon process.
      console.warn("⚠️ [Supabase DB Pool] Idle client reset (self-healing):", err.message);
    });
  }
  return poolInstance;
}

/**
 * Memastikan tabel wa_auth_store tersedia di Supabase PostgreSQL.
 */
export async function ensureAuthTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_auth_store (
      id TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS wa_auth_store_updated_idx ON wa_auth_store (updated_at);
  `);
}

/**
 * useSupabaseAuthState
 * Adapter penyimpanan auth Baileys berbasis database Supabase (PostgreSQL).
 * Menyimpan 'creds' dan cryptographic keys di tabel wa_auth_store.
 * 
 * Keuntungan:
 * 1. Worker di Cloud Container (Koyeb/Render) tidak kehilangan sesi saat restart/redeploy.
 * 2. Mendukung migrasi otomatis dari file lokal (auth_info_baileys/creds.json) pada boot pertama.
 * 3. Fallback transparan ke useMultiFileAuthState jika DATABASE_URL tidak dikonfigurasi.
 */
export async function useSupabaseAuthState(localAuthDir = path.join(__dirname, "auth_info_baileys")) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("⚠️ DATABASE_URL tidak ditemukan. Menggunakan fallback lokal useMultiFileAuthState.");
    return useMultiFileAuthState(localAuthDir);
  }

  const pool = getDbPool();
  await ensureAuthTable(pool);

  // 1. Cek apakah creds sudah ada di database Supabase
  let creds = null;
  try {
    const res = await pool.query("SELECT value FROM wa_auth_store WHERE id = 'creds' LIMIT 1");
    if (res.rows.length > 0) {
      creds = JSON.parse(JSON.stringify(res.rows[0].value), BufferJSON.reviver);
      const userJid = creds?.me?.id || "tersimpan";
      console.log(`🔐 [Auth Store] Sesi Baileys ditemukan di Supabase untuk user: ${userJid}`);
    }
  } catch (err) {
    console.error("✖ Gagal membaca creds dari wa_auth_store:", err.message);
  }

  // 2. Jika di database belum ada, coba migrasi dari localAuthDir/creds.json atau WA_SESSION_DATA
  if (!creds) {
    if (process.env.WA_SESSION_DATA) {
      try {
        const decoded = Buffer.from(process.env.WA_SESSION_DATA, "base64").toString("utf-8");
        creds = JSON.parse(decoded, BufferJSON.reviver);
        console.log("🔐 [Auth Store] Sesi berhasil dimuat dari WA_SESSION_DATA env!");
      } catch (e) {
        console.warn("⚠️ Gagal mem-parse WA_SESSION_DATA:", e.message);
      }
    }

    if (!creds) {
      const localCredsPath = path.join(localAuthDir, "creds.json");
      if (fs.existsSync(localCredsPath)) {
        try {
          const raw = await fsp.readFile(localCredsPath, "utf8");
          creds = JSON.parse(raw, BufferJSON.reviver);
          console.log(`📦 [Auth Store] Mentransfer sesi lokal (${localCredsPath}) ke Supabase...`);
          
          // Simpan creds ke Supabase
          const serializedCreds = JSON.stringify(creds, BufferJSON.replacer);
          await pool.query(
            `INSERT INTO wa_auth_store (id, value, updated_at)
             VALUES ('creds', $1::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [serializedCreds]
          );

          // Salin juga key pendukung penting (app-state-sync dan pre-key awal) jika ada
          try {
            const files = await fsp.readdir(localAuthDir);
            const keyFiles = files.filter(
              (f) =>
                f.endsWith(".json") &&
                (f.startsWith("app-state-sync") ||
                  f.startsWith("signed-pre-key") ||
                  f.startsWith("pre-key-1.") ||
                  f.startsWith("session-62811443327"))
            );

            if (keyFiles.length > 0) {
              const upsertIds = [];
              const upsertVals = [];
              for (const file of keyFiles.slice(0, 100)) {
                try {
                  const content = await fsp.readFile(path.join(localAuthDir, file), "utf8");
                  const keyId = file.replace(/\.json$/, "");
                  upsertIds.push(keyId);
                  upsertVals.push(content);
                } catch {
                  /* skip individual corrupt file */
                }
              }

              if (upsertIds.length > 0) {
                await pool.query(
                  `INSERT INTO wa_auth_store (id, value, updated_at)
                   SELECT unnest($1::text[]), unnest($2::jsonb[]), NOW()
                   ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                  [upsertIds, upsertVals]
                );
              }
              console.log(`🔄 [Auth Store] Migrasi selesai: ${upsertIds.length} kunci sesi tersimpan ke Supabase.`);
            }
          } catch (migErr) {
            console.warn("⚠️ Migrasi kunci tambahan dilewati:", migErr.message);
          }
        } catch (readErr) {
          console.warn("⚠️ Gagal membaca creds lokal:", readErr.message);
        }
      }
    }

    // Jika tetap belum ada sesi sama sekali, buat baru untuk QR scan
    if (!creds) {
      console.log("📱 [Auth Store] Tidak ada sesi tersimpan. Menyiapkan kredensial baru (memerlukan scan QR).");
      creds = initAuthCreds();
    }
  }

  // 3. Bangun state interface sesuai ekspektasi Baileys
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          if (!ids || ids.length === 0) return data;

          const dbIds = ids.map((id) => `${type}-${id}`);
          try {
            const res = await pool.query(
              "SELECT id, value FROM wa_auth_store WHERE id = ANY($1::text[])",
              [dbIds]
            );

            const map = new Map();
            for (const row of res.rows) {
              try {
                let val = JSON.parse(JSON.stringify(row.value), BufferJSON.reviver);
                if (type === "app-state-sync-key" && val) {
                  val = proto.Message.AppStateSyncKeyData.fromObject(val);
                }
                map.set(row.id, val);
              } catch {
                /* skip */
              }
            }

            for (const id of ids) {
              const fullId = `${type}-${id}`;
              data[id] = map.get(fullId) ?? null;
            }
          } catch (err) {
            console.error(`✖ Error membaca keys (${type}):`, err.message);
            for (const id of ids) data[id] = null;
          }

          return data;
        },

        set: async (data) => {
          const toUpsert = [];
          const toDelete = [];

          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const keyId = `${category}-${id}`;
              if (value) {
                toUpsert.push({ id: keyId, value });
              } else {
                toDelete.push(keyId);
              }
            }
          }

          try {
            if (toUpsert.length > 0) {
              // Batch upsert ke Supabase
              const ids = toUpsert.map((x) => x.id);
              const values = toUpsert.map((x) => JSON.stringify(x.value, BufferJSON.replacer));
              await pool.query(
                `INSERT INTO wa_auth_store (id, value, updated_at)
                 SELECT unnest($1::text[]), unnest($2::jsonb[]), NOW()
                 ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                [ids, values]
              );
            }

            if (toDelete.length > 0) {
              await pool.query("DELETE FROM wa_auth_store WHERE id = ANY($1::text[])", [toDelete]);
            }
          } catch (err) {
            console.error("✖ Error menyimpan keys ke Supabase:", err.message);
          }
        },
      },
    },

    saveCreds: async () => {
      try {
        const serialized = JSON.stringify(creds, BufferJSON.replacer);
        await pool.query(
          `INSERT INTO wa_auth_store (id, value, updated_at)
           VALUES ('creds', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [serialized]
        );
      } catch (err) {
        console.error("✖ Gagal menyimpan creds ke Supabase:", err.message);
      }
    },
  };
}
