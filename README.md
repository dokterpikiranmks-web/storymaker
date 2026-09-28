# 🧠 Story Maker — Autonomous Neuro-Storytelling Engine (PRD v1.0)

Ubah satu ide mentah (teks singkat / transkrip voice note) menjadi **4 babak Story WhatsApp & Instagram** berbasis psikologi dopamin & hipnosis percakapan, lengkap dengan **visual 1080×1920** yang dirender tanpa API gambar berbayar — di atas arsitektur **100% free-tier (Rp 0/bulan)**.

| Babak | Jam | Fungsi | Tema visual default |
|---|---|---|---|
| 1 · `ACT_1_HOOK` | 07:15 | Pattern Interrupt & Open Loop | Neuro-Dark |
| 2 · `ACT_2_SOMATIC` | 12:30 | Somatic & Logic Breakthrough | Somatic-Clean |
| 3 · `ACT_3_CLINICAL_AI` | 18:45 | The Clinical & AI Parallel | Hacker-Terminal |
| 4 · `ACT_4_ANCHOR` | 21:30 | Subconscious Anchor & CTA (`KETIK 'RESET'`) | Minimal-Hypnotic |

---

## 1. Struktur direktori

```
.
├── .env.example                      # Semua env var (Gemini, Supabase, IG, secrets)
├── drizzle.config.json               # Drizzle Kit → src/db/schema.ts
├── next.config.ts                    # serverExternalPackages (resvg), font tracing, security headers
├── supabase/
│   └── schema.sql                    # SQL lengkap untuk Supabase (enum, tabel, index, RLS, bucket)
├── worker/                           # SPRINT 5 — daemon lokal WhatsApp (proyek Node terpisah)
│   ├── index.mjs                     # Baileys + QR terminal + polling 60 detik + status@broadcast
│   ├── package.json
│   └── .env.example
└── src/
    ├── proxy.ts                      # Next 16 Proxy: kunci dashboard dengan DASHBOARD_PASSCODE
    ├── assets/fonts/                 # Inter, JetBrains Mono, Playfair (WOFF untuk Satori)
    ├── db/
    │   ├── index.ts                  # Pool pg + Drizzle client
    │   └── schema.ts                 # daily_campaigns, story_slides, gemini_model_telemetry, story_assets, app_state
    ├── lib/
    │   ├── gemini/
    │   │   ├── detector.ts           # ★ SPRINT 1 — Autodetect, cascade, circuit breaker, backoff, getOptimalModel()
    │   │   ├── generate.ts           # ★ generateHypnoticContent(prompt, systemInstruction) + structured output
    │   │   ├── telemetry.ts          # Log setiap percobaan ke gemini_model_telemetry
    │   │   └── status.ts             # Snapshot Quota Guard untuk dashboard
    │   ├── prompts/alchemist.ts      # ★ SPRINT 2 — Master system prompt 4 pilar + JSON schema
    │   ├── stories/
    │   │   ├── constants.ts          # Definisi babak, tema, jam tayang
    │   │   ├── engine.ts             # Orkestrasi Gemini → validasi/normalisasi → fallback offline
    │   │   ├── offline.ts            # Offline Alchemist (template deterministik saat Gemini tak tersedia)
    │   │   └── types.ts              # DTO bersama client/server
    │   ├── render/                   # ★ SPRINT 3 — Satori + resvg
    │   │   ├── templates.tsx         # 4 template JSX 1080×1920
    │   │   ├── renderer.ts           # JSX → SVG → PNG (resvg) / JPEG (jpeg-js, untuk Instagram)
    │   │   ├── fonts.ts
    │   │   └── storage.ts            # Supabase Storage `story-assets` → fallback Postgres
    │   ├── supabase/
    │   │   ├── client.ts             # Browser client (anon key, opsional)
    │   │   └── server.ts             # Admin client (service role) + bucket bootstrap
    │   ├── campaigns.ts              # CRUD, render, penjadwalan, antrean daemon (lease anti double-post)
    │   ├── dispatch.ts               # Publish IG idempoten + lock
    │   ├── instagram.ts              # Meta Graph API Content Publishing (STORIES)
    │   ├── auth.ts                   # Session HMAC + bearer secret worker/cron
    │   ├── env.ts / validation.ts / api.ts / utils.ts / client-api.ts
    ├── components/
    │   ├── ui/                       # Primitif gaya shadcn (button, badge, card, input)
    │   └── studio/                   # ★ SPRINT 4 — Idea Drop, Story Studio Carousel, Slide Card, panel samping
    └── app/
        ├── dashboard/page.tsx        # /dashboard
        ├── login/page.tsx
        └── api/
            ├── stories/generate      # POST — ide → 4 babak (Task 2.2)
            ├── render/slide          # POST — PNG 1080×1920 / simpan & kembalikan URL (Task 3.1, 3.3)
            ├── campaigns[/:id]       # GET/DELETE, /schedule, /download (ZIP), /render
            ├── slides/:id            # GET/PATCH (inline edit → auto re-render)
            ├── dispatch/instagram    # POST — Meta Graph API (Task 5.2)
            ├── worker/queue, ack     # Bridge untuk daemon lokal (Bearer WORKER_SECRET)
            ├── cron/dispatch         # IG terjadwal tanpa daemon (Bearer CRON_SECRET)
            ├── gemini/status         # Snapshot / re-discover / reset breaker
            ├── system/status, settings/persona, auth/*, assets/:id, media/:id, health
```

## 2. Gemini Autodetect & Quota Guard (`src/lib/gemini/detector.ts`)

1. **Dynamic discovery** — `ai.models.list()` mendaftar semua model yang mendukung `generateContent` untuk API key Anda. Varian non-teks (image, tts, live, embedding, dsb.) disaring; bila listing gagal, seed statis diprobe via `ai.models.get()` (tanpa memakan kuota generate).
2. **Prioritized cascade** — Flash generasi terbaru → Flash lebih lama → Flash-Lite (stabil sebelum preview). Nama PRD (`gemini-2.5-flash → 2.0-flash → 1.5-flash → 2.0-flash-lite`) tetap dikenali; model yang sudah dimatikan Google otomatis ditandai *unavailable* (404 / tidak terdaftar) sehingga tidak pernah membuang request. Override manual: `GEMINI_MODEL_PRIORITY`.
3. **Circuit breaker + exponential backoff** — 429 membuka breaker selama `max(retryDelay server, 60s)`, dan durasinya **berlipat ganda** tiap kegagalan beruntun (maks 15 menit). Kuota harian → 1 jam, `limit: 0` (tidak tersedia di free tier) → 6 jam, 503/5xx/timeout → cooldown pendek. Request dilempar ke model berikutnya **secara transparan**; bila seluruh cascade sedang cooldown, engine menunggu breaker tercepat (backoff) lalu jatuh ke **Offline Alchemist** agar request pengguna tidak pernah gagal.
4. **Telemetry** — setiap percobaan tercatat di `gemini_model_telemetry`; instance serverless yang baru hidup menghidrasi ulang breaker dari tabel ini.

## 3. Menjalankan

```bash
cp .env.example .env          # isi GEMINI_API_KEY (gratis: aistudio.google.com)
npm install
npx drizzle-kit push          # atau jalankan supabase/schema.sql di Supabase SQL Editor
npm run dev                   # http://localhost:3000/dashboard
```

Tanpa `GEMINI_API_KEY` aplikasi tetap berfungsi penuh memakai Offline Alchemist Template.

### Daemon WhatsApp (lokal / VPS mini)

```bash
cd worker
npm install
cp .env.example .env          # STORY_MAKER_URL + WORKER_SECRET (sama dengan server)
npm start                     # scan QR di terminal (WhatsApp → Perangkat tertaut)
```

Daemon polling `GET /api/worker/queue` tiap 60 detik, mengambil JPEG slide dari `/api/media/:id`, memposting ke `status@broadcast` dengan `statusJidList` (kontak tersinkron atau `WA_STATUS_AUDIENCE`), lalu `POST /api/worker/ack`. Job WhatsApp di-*lease* secara atomik sehingga dua daemon tidak mungkin double-post; slide yang tertunda > `DISPATCH_STALE_HOURS` (default 6 jam) ditandai `FAILED` agar story pagi tidak tayang malam.

### Instagram

Isi `IG_USER_ID` + `IG_ACCESS_TOKEN` (akun Business, izin content publish). Instagram mengunduh gambar sendiri, jadi dibutuhkan URL **HTTPS publik**: deploy ke Vercel dengan `APP_URL`, atau aktifkan Supabase Storage. Slide dirender sebagai JPEG (syarat Graph API). Jadwal IG dijalankan oleh daemon atau `GET /api/cron/dispatch` (Vercel Cron / cron-job.org, `Authorization: Bearer CRON_SECRET`).

## 4. Keamanan (catatan untuk Gravity)

- `DASHBOARD_PASSCODE` → cookie sesi HMAC-SHA256 berkedaluwarsa (httpOnly, SameSite=Lax), throttle brute-force; Proxy + verifikasi ulang di setiap route handler.
- Daemon & cron memakai bearer secret (`WORKER_SECRET` / `CRON_SECRET`) dengan perbandingan constant-time; endpoint worker **nonaktif** bila secret kosong.
- Service-role key & token Meta hanya di server (`server-only`); pesan error Gemini disanitasi sebelum disimpan.
- Semua input divalidasi Zod; header keamanan (nosniff, frame DENY, referrer policy) aktif.
- RLS aktif tanpa policy publik (deny-by-default untuk anon key). Folder sesi WhatsApp (`worker/auth_info`) di-*gitignore*.
- `/api/assets/:id` & `/api/media/:id` sengaja publik (UUID tak tertebak) karena dibutuhkan Meta & daemon.
