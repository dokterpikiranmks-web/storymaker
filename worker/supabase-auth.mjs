import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { BufferJSON, initAuthCreds, proto, useMultiFileAuthState } from "@whiskeysockets/baileys";

const { Pool } = pg;
const fsp = fs.promises;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const AUTH_KEY_PREFIX = "storymaker:";

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
      ssl: (process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1"))
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
 * Membersihkan seluruh key autentikasi khusus StoryMaker dari wa_auth_store.
 * Mengabaikan key aplikasi lain yang ada di tabel yang sama.
 */
export async function clearSupabaseAuthState(pool = getDbPool()) {
  if (!pool) return;
  try {
    await pool.query("DELETE FROM wa_auth_store WHERE id LIKE $1", [`${AUTH_KEY_PREFIX}%`]);
    await pool.query(
      `INSERT INTO wa_auth_store (id, value, updated_at)
       VALUES ($1, '{"status":"DITAUTKAN_ULANG"}'::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [`${AUTH_KEY_PREFIX}session_status`]
    ).catch(() => undefined);
    console.log(`🧹 [Auth Store] Sesi '${AUTH_KEY_PREFIX}' berhasil dibersihkan dari wa_auth_store.`);
  } catch (err) {
    console.error("⚠️ Gagal membersihkan sesi StoryMaker di Supabase:", err.message);
  }
}

/**
 * useSupabaseAuthState
 * Adapter penyimpanan auth Baileys berbasis database Supabase (PostgreSQL).
 * Menyimpan 'storymaker:creds' dan cryptographic keys di tabel wa_auth_store dengan namespace storymaker:.
 * 
 * Keuntungan:
 * 1. Isolasi total: co-exist aman dengan bot lain pada nomor yang sama tanpa Error 440 (Conflict).
 * 2. Worker di Cloud Container (Render/Koyeb) tidak kehilangan sesi saat restart/redeploy.
 * 3. Fallback transparan ke useMultiFileAuthState jika DATABASE_URL tidak dikonfigurasi.
 */
export async function useSupabaseAuthState(localAuthDir = path.join(__dirname, "auth_info_storymaker")) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("⚠️ DATABASE_URL tidak ditemukan. Menggunakan fallback lokal useMultiFileAuthState.");
    return useMultiFileAuthState(localAuthDir);
  }

  const pool = getDbPool();
  await ensureAuthTable(pool);

  const credsKey = `${AUTH_KEY_PREFIX}creds`;

  // 1. Cek apakah creds storymaker sudah ada di database Supabase
  let creds = null;
  try {
    const res = await pool.query(
      "SELECT value FROM wa_auth_store WHERE id = $1 LIMIT 1",
      [credsKey]
    );
    if (res.rows.length > 0) {
      creds = JSON.parse(JSON.stringify(res.rows[0].value), BufferJSON.reviver);
      if (creds?.me && creds.registered !== true) {
        creds.registered = true;
      }
      const userJid = creds?.me?.id || "tersimpan";
      console.log(`🔐 [Auth Store] Sesi Baileys StoryMaker ('${credsKey}') ditemukan di Supabase untuk user: ${userJid}`);
    }
  } catch (err) {
    console.error(`✖ Gagal membaca creds ('${credsKey}') dari wa_auth_store:`, err.message);
  }

  // 2. Jika di database belum ada, cek WA_SESSION_DATA atau migrasi lokal khusus storymaker
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
          console.log(`📦 [Auth Store] Mentransfer sesi lokal StoryMaker (${localCredsPath}) ke Supabase...`);
          
          // Simpan creds ke Supabase dengan prefix storymaker:
          const serializedCreds = JSON.stringify(creds, BufferJSON.replacer);
          await pool.query(
            `INSERT INTO wa_auth_store (id, value, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [credsKey, serializedCreds]
          );

          // Salin juga key pendukung penting jika ada
          try {
            const files = await fsp.readdir(localAuthDir);
            const keyFiles = files.filter(
              (f) =>
                f.endsWith(".json") &&
                (f.startsWith("app-state-sync") ||
                  f.startsWith("signed-pre-key") ||
                  f.startsWith("pre-key-") ||
                  f.startsWith("session-"))
            );

            if (keyFiles.length > 0) {
              const upsertIds = [];
              const upsertVals = [];
              for (const file of keyFiles.slice(0, 100)) {
                try {
                  const content = await fsp.readFile(path.join(localAuthDir, file), "utf8");
                  const keyId = `${AUTH_KEY_PREFIX}${file.replace(/\.json$/, "")}`;
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
              console.log(`🔄 [Auth Store] Migrasi selesai: ${upsertIds.length} kunci sesi tersimpan ke Supabase dengan prefix '${AUTH_KEY_PREFIX}'.`);
            }
          } catch (migErr) {
            console.warn("⚠️ Migrasi kunci tambahan dilewati:", migErr.message);
          }
        } catch (readErr) {
          console.warn("⚠️ Gagal membaca creds lokal StoryMaker:", readErr.message);
        }
      }
    }

    // Jika tetap belum ada sesi sama sekali, siapkan creds baru untuk fresh pairing QR scan
    if (!creds) {
      console.log(`📱 [Auth Store] Kredensial '${credsKey}' belum ada di Supabase. Menyiapkan kredensial baru (memerlukan scan QR).`);
      creds = initAuthCreds();
    }
  }

  // Sequential FIFO write queue & debounce timer to avoid race conditions / Bad MAC
  let writeQueue = Promise.resolve();
  function enqueueWrite(task) {
    const next = writeQueue.then(task, task);
    writeQueue = next.catch(() => {});
    return next;
  }
  let credsSaveTimer = null;

  // 3. Bangun state interface sesuai ekspektasi Baileys (dengan isolasi namespace storymaker:)
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          if (!ids || ids.length === 0) return data;

          const dbIds = ids.map((id) => `${AUTH_KEY_PREFIX}${type}-${id}`);
          try {
            const res = await pool.query(
              "SELECT id, value FROM wa_auth_store WHERE id = ANY($1::text[]) AND id LIKE $2",
              [dbIds, `${AUTH_KEY_PREFIX}%`]
            );

            const map = new Map();
            for (const row of res.rows) {
              if (!row.id.startsWith(AUTH_KEY_PREFIX)) continue;
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
              const fullId = `${AUTH_KEY_PREFIX}${type}-${id}`;
              data[id] = map.get(fullId) ?? null;
            }
          } catch (err) {
            console.error(`✖ Error membaca keys (${type}) dari Supabase:`, err.message);
            for (const id of ids) data[id] = null;
          }

          return data;
        },

        set: async (data) => {
          return enqueueWrite(async () => {
            const toUpsert = [];
            const toDelete = [];

            for (const category of Object.keys(data)) {
              for (const id of Object.keys(data[category])) {
                const value = data[category][id];
                const keyId = `${AUTH_KEY_PREFIX}${category}-${id}`;
                if (value) {
                  toUpsert.push({ id: keyId, value });
                } else {
                  toDelete.push(keyId);
                }
              }
            }

            try {
              if (toUpsert.length > 0) {
                // Batch upsert ke Supabase - filter ketat hanya key berawalan storymaker:
                const validUpserts = toUpsert.filter((x) => x.id.startsWith(AUTH_KEY_PREFIX));
                if (validUpserts.length > 0) {
                  const ids = validUpserts.map((x) => x.id);
                  const values = validUpserts.map((x) => JSON.stringify(x.value, BufferJSON.replacer));
                  await pool.query(
                    `INSERT INTO wa_auth_store (id, value, updated_at)
                     SELECT unnest($1::text[]), unnest($2::jsonb[]), NOW()
                     ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                    [ids, values]
                  );
                }
              }

              if (toDelete.length > 0) {
                // Batch delete ke Supabase - filter ketat hanya key berawalan storymaker:
                const validDeletes = toDelete.filter((x) => x.startsWith(AUTH_KEY_PREFIX));
                if (validDeletes.length > 0) {
                  await pool.query(
                    "DELETE FROM wa_auth_store WHERE id = ANY($1::text[]) AND id LIKE $2",
                    [validDeletes, `${AUTH_KEY_PREFIX}%`]
                  );
                }
              }
            } catch (err) {
              console.error("✖ Error menyimpan keys ke Supabase:", err.message);
            }
          });
        },

        clear: async () => {
          return enqueueWrite(async () => {
            try {
              await pool.query("DELETE FROM wa_auth_store WHERE id LIKE $1", [`${AUTH_KEY_PREFIX}%`]);
              console.log(`🧹 [Auth Store] Semua key '${AUTH_KEY_PREFIX}' dibersihkan dari wa_auth_store.`);
            } catch (err) {
              console.error("✖ Gagal membersihkan keys dari wa_auth_store:", err.message);
            }
          });
        },
      },
    },

    saveCreds: (immediate = false) => {
      const performSaveCreds = async () => {
        try {
          if (creds?.me && !creds.registered) {
            creds.registered = true;
          }
          const serialized = JSON.stringify(creds, BufferJSON.replacer);
          await pool.query(
            `INSERT INTO wa_auth_store (id, value, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [credsKey, serialized]
          );
        } catch (err) {
          console.error(`✖ Gagal menyimpan creds ('${credsKey}') ke Supabase:`, err.message);
        }
      };

      if (immediate === true) {
        if (credsSaveTimer) {
          clearTimeout(credsSaveTimer);
          credsSaveTimer = null;
        }
        return enqueueWrite(performSaveCreds);
      }

      if (credsSaveTimer) {
        clearTimeout(credsSaveTimer);
      }
      return new Promise((resolve) => {
        credsSaveTimer = setTimeout(() => {
          credsSaveTimer = null;
          enqueueWrite(performSaveCreds).then(resolve);
        }, 500);
      });
    },
  };
}
