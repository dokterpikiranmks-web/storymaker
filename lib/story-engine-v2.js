/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V3.0 — Conversational AI Engine (lib/story-engine-v2.js)
 *  Brand: Dokter Pikiran (Ahmad Jawahir Zain) • Makassar, WITA (UTC+8)
 * ════════════════════════════════════════════════════════════════════════════
 *  Revisi Akbar V3.0:
 *  - Bahasa Indonesia Santai & Akrab ("Pernah ngerasa...", "Bukan karena...", "Bayangin tubuh kita kayak...")
 *  - Hapus semua istilah akademis kaku. Jelaskan psikosomatis dengan analogi tongkrongan berbobot.
 *  - Paradoxical Insight tetap tajam: Anomali biologis nyata membalikkan mitos umum.
 *  - Struktur Infografis 5 Story:
 *    * Story 1 (07:00 WITA): Pertanyaan pemantik relate keseharian (maks 15 kata).
 *    * Story 2 (07:45 WITA): Skema sebab-akibat sederhana (flowchart: 3 node).
 *    * Story 3 (13:00 WITA): Panduan 3 langkah visual bisa dicoba sambil duduk.
 *    * Story 4 (20:00 WITA): Cerita nyata santai dari meja terapi Makassar.
 *    * Story 5 (21:00 WITA): Refleksi tenang malam hari + ajakan curhat / obrolan santai lewat balas status WA.
 *  - Sinkronisasi Data Naskah Harian (data/active-daily-story.json).
 * ════════════════════════════════════════════════════════════════════════════
 */

const fs = require("node:fs");
const path = require("node:path");
const { GoogleGenAI } = require("@google/genai");

// Identitas Brand & Persona Resmi Dokter Pikiran
const BRAND_IDENTITY = {
  creator: "Ahmad Jawahir Zain",
  brand: "Dokter Pikiran",
  location: "Makassar, WITA (UTC+8)",
  persona:
    "Ahmad Jawahir Zain (Dokter Pikiran Makassar), hipnoterapis klinis dan solo dev AI yang mengobrol akrab, hangat, empatik, menggunakan bahasa Indonesia santai ('Pernah ngerasa...', 'Bukan karena...', 'Bayangin tubuh kita kayak...'). Mengurai anomali psikosomatis dan bawah sadar dengan analogi sederhana yang langsung mengena di kepala tanpa istilah medis kaku.",
  audience:
    "Pria & wanita usia 25-45 tahun yang lelah dengan tips wellness klise, sering psikosomatis (asam lambung, sesak dada, insomnia, leher kaku), dan butuh penjelasan biologis nyata yang masuk akal.",
  tone:
    "Akrab, hangat, santai, empatik seperti obrolan di warkop Makassar berbobot, tajam membongkar mitos dengan wawasan paradoks (paradoxical truth), tanpa istilah medis akademis yang membosankan.",
};

// 3 Pilar Konten Mutlak
const PILLARS = {
  PIKIRAN: {
    key: "PIKIRAN",
    title: "Bawah Sadar, Belief System & Suara Batin",
    description: "Mengurai error afirmasi positif, suara batin overthinking, dan tombol aman bawah sadar.",
    defaultKeyword: "RESET",
    themeColor: "#1E293B", // Muted Dark Slate
    accentColor: "#63B3ED", // Soft Sky Blue
  },
  TUBUH: {
    key: "TUBUH",
    title: "Gut-Brain, Sistem Saraf & Paradoks Tubuh",
    description: "Anomali klep asam lambung, cemas saat rebahan, dan pelepasan kuncian saraf somatik.",
    defaultKeyword: "LAMBUNG",
    themeColor: "#162621", // Deep Forest Sage
    accentColor: "#74A892", // Warm Mint Green
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    title: "Kelelahan Mental, Fokus & Pikiran Berisik",
    description: "Analogi baterai mental, overthinking seharian, dan cara mematikan beban pikiran yang menggantung.",
    defaultKeyword: "FOKUS",
    themeColor: "#121214", // Deep Charcoal Obsidian
    accentColor: "#E2B774", // Warm Amber Sand
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5 Variasi Topik Paradoks Per Pilar (Bahasa Santai & Infografis V3.0)
// ════════════════════════════════════════════════════════════════════════════
const CURATED_VARIATIONS = {
  TUBUH: [
    {
      topic: "Kenapa Asam Lambung Kambuh Justru Bukan Karena Makanan Pedas?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Pernah ngerasa asam lambung tiba-tiba perih pas lagi panik deadline?",
          visualGuide: {
            headline: "Bukan Karena Cabe",
            badge: "🚨 ANOMALI LAMBUNG",
            palette: "Forest Sage & Warm Linen",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Bukan karena cabe. Saat otak panik, lambung kekurangan asam sampai klepnya lupa nutup rapat.",
          visualGuide: {
            headline: "Klep Lambung Bocor",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Alarm Otak Aktif", "Saraf Vagus Kaget", "Klep Lambung Terbuka"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Jaw Release 60 Detik: Renggangkan rahang, tempel lidah ke langit-langit mulut sambil duduk santai.",
          visualGuide: {
            headline: "Trigeminal Jaw Release",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Buka mulut santai dan renggangkan rahang bawah 1 cm", target: "Rahang & Sendi TMJ" },
              { step: "02", action: "Tempelkan ujung lidah lembut ke langit-langit mulut atas", target: "Saraf Trigeminal" },
              { step: "03", action: "Bernapas pelan 5 siklus. Rasakan perih di dada perlahan reda", target: "Klep Esofagus Rileks" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Kemarin di meja terapi Batua Raya Makassar, pasien ngeluh gerd 2 tahun. Begitu kuncian saraf rahangnya kita lepas, lambungnya jinak tanpa obat.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Malam ini izinkan tubuhmu narik napas lega tanpa rasa takut. Balas status ini kalau mau ngobrol santai: LAMBUNG.",
          visualGuide: {
            headline: "Tubuhmu Berhak Tenang",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Rebahan Malah Gelisah: Kenapa Saat Santai Tubuh Malah Berdebar & Migrain?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Niatnya mau santai rebahan, tapi dada malah deg-degan dan gelisah?",
          visualGuide: {
            headline: "Rebahan Malah Gelisah",
            badge: "🚨 PARADOKS REBAHAN",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saraf terbiasa siaga tinggi. Waktu hormon stres turun mendadak, otak mengira ada bahaya sebelum badai.",
          visualGuide: {
            headline: "Alarm Sebelum Badai",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Saraf Siaga Kronis", "Adrenalin Turun Tiba-tiba", "Alarm Bahaya Palsu"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Physiological Sigh 60 Detik: Ambil dua tarikan napas pendek cepat, buang panjang lewat mulut.",
          visualGuide: {
            headline: "Physiological Sigh 60s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Tarik napas pendek 2 kali berturut-turut lewat hidung", target: "Alveoli Paru-paru" },
              { step: "02", action: "Hembuskan satu napas panjang perlahan lewat mulut terbuka", target: "Saraf Vagus Aktif" },
              { step: "03", action: "Ulangi 3 kali. Rasakan debaran dada langsung melambat", target: "Detak Jantung Kalem" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Kasus meja terapi Makassar: profesional yang tiap weekend pasti migrain dan panik. Masalahnya bukan lambung, tapi sarafnya belum diajari bahwa hening itu aman.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Rebahan itu hak tubuhmu, bukan tanda bahaya. Balas status ini kalau ada yang mengganjal: LAMBUNG.",
          visualGuide: {
            headline: "Izin Rehat Aman",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Makin Dipaksa Tidur Cepat, Kenapa Mata Malah Makin Benderang Terjaga?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Makin keras kamu berusaha tidur, kenapa mata malah makin melek segar?",
          visualGuide: {
            headline: "Paradoks Memaksa Tidur",
            badge: "🚨 ANOMALI INSOMNIA",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Tidur adalah pelepasan kendali. Memaksa tidur dibaca otak sebagai tugas darurat yang memicu hormon siaga.",
          visualGuide: {
            headline: "Usaha Memicu Siaga",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Maksa Sadar Mau Tidur", "Kortisol & Adrenalin Naik", "Otak Terjaga Benderang"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Sub-occipital Eye Reset 60 Detik: Lirikkan bola mata ke kanan penuh 30 detik tanpa menolehkan kepala.",
          visualGuide: {
            headline: "Sub-occipital Eye Reset",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Baring telentang santai, kepala lurus menatap langit-langit", target: "Kepala Netral" },
              { step: "02", action: "Lirikkan kedua bola mata ke kanan penuh selama 30 detik", target: "Saraf Tengkuk Kranial" },
              { step: "03", action: "Tunggu reflek menguap atau menelan ludah secara spontan", target: "Alarm Siaga Mati" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Pasien insomnia Makassar berbulan-bulan minum herbal tanpa hasil. Begitu berhenti memaksakan tidur dan merilekskan saraf tengkuk, ia pulas dalam 10 menit.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Malam ini jangan tuntut dirimu tertidur. Cukup biarkan kasur menopang berat ragamu. Balas status ini kalau butuh teman ngobrol: LAMBUNG.",
          visualGuide: {
            headline: "Lepaskan Tuntutan Tidur",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Leher & Pundak Kaku Menahun: Kenapa Pijatan Sering Gagal Menuntaskan Ketegangan?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Pundakmu kaku kayak batu bukan salah bantal, tapi sarafmu lagi pasang perisai.",
          visualGuide: {
            headline: "Bukan Salah Bantal",
            badge: "🚨 KUNCIAN PUNDAK",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otot pundak terhubung saraf kranial. Saat batin memikul ancaman, pundak mengunci otomatis sebagai perisai leher.",
          visualGuide: {
            headline: "Perisai Biologis Leher",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Batin Memikul Beban", "Saraf Aksesorius Siaga", "Pundak Mengunci Otomatis"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Lateral Eye & Shoulder Drop 60 Detik: Sentuh tengkuk, lirikkan mata ke sudut kiri atas 30 detik.",
          visualGuide: {
            headline: "Lateral Shoulder Drop",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Sentuh tengkuk belakang dengan satu telapak tangan lembut", target: "Otot Trapezius" },
              { step: "02", action: "Lirikkan mata ke sudut kiri atas 30 detik tanpa menoleh", target: "Saraf Kranial Leher" },
              { step: "03", action: "Hembuskan napas panjang, rasakan bahu turun otomatis 2 cm", target: "Bahu Turun Rileks" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar: puluhan sesi pijat cuma tahan dua hari kalau batinnya terus merasa memikul tanggung jawab yang bukan porsinya.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tanggalkan baju zirahmu malam ini, kamu tidak sedang di medan perang. Balas status ini kalau pundakmu masih kaku: LAMBUNG.",
          visualGuide: {
            headline: "Tanggalkan Perisai Malam Ini",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Napas Pendek & Sensasi Dada Terhimpit: Kenapa Menarik Napas Dalam Malah Bikin Sesak?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Dada terasa sesak lalu kamu tarik napas dalam-dalam? Itu justru bikin makin engap.",
          visualGuide: {
            headline: "Paradoks Tarik Napas",
            badge: "🚨 ANOMALI PERNAPASAN",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Menarik napas berlebihan membuang CO2 terlalu cepat. Pembuluh menyempit dan otak merasa makin kekurangan udara.",
          visualGuide: {
            headline: "Penyempitan Pembuluh",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Panik Hirup Napas Cepat", "Karbon Dioksida Drop", "Pembuluh Darah Sempit"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Exhale Prolongation 60 Detik: Hirup pelan 2 detik lewat hidung, hembuskan lembut 6 detik lewat bibir.",
          visualGuide: {
            headline: "Exhale Prolongation 6s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Hirup udara pelan 2 detik lewat hidung tanpa busung dada", target: "Hidung & Diafragma" },
              { step: "02", action: "Kerutkan bibir, hembuskan lembut 6 detik sampai paru kempis", target: "Bibir & Paru-paru" },
              { step: "03", action: "Ulangi 4 siklus. Rasakan rongga dada langsung terasa lega", target: "Keseimbangan Gas Darah" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien klinik Batua Raya sering panik mengira serangan jantung. Begitu pola hembusannya diperpanjang, sesak dadanya lenyap tanpa obat penenang.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tubuhmu tidak kekurangan udara, ia hanya perlu berhenti bertarung melawan rasa sesak. Balas status ini kalau mau cerita: LAMBUNG.",
          visualGuide: {
            headline: "Berhenti Bertarung Melawan Sesak",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
  ],

  PIKIRAN: [
    {
      topic: "Kenapa Memaksa Berpikir Positif Justru Bikin Cemas Makin Parah?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Lagi cemas tapi maksain bilang 'aku tenang'? Otakmu malah ngira kamu lagi bohong.",
          visualGuide: {
            headline: "Bukan Kurang Positif",
            badge: "💡 PARADOKS AFIRMASI",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saat tubuh ngerasa nggak aman, kata manis dibaca otak sebagai sinyal palsu yang melipatgandakan kecemasan.",
          visualGuide: {
            headline: "Error Mismatch Batin",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Bawah Sadar Cemas", "Afirmasi Manis Dipaksa", "Otak Baca Sinyal Bohong"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Sub-occipital Eye Reset 60 Detik: Lirikkan bola mata ke kanan 30 detik sampai ada reflek menguap.",
          visualGuide: {
            headline: "Lateral Eye Reset",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Duduk santai, letakkan kedua telapak tangan di atas paha", target: "Postur Grounding" },
              { step: "02", action: "Lirikkan mata ke kanan penuh 30 detik tanpa menoleh", target: "Saraf Kranial Belakang" },
              { step: "03", action: "Tunggu sensasi menelan ludah atau napas dalam spontan", target: "Alarm Bahaya Mati" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di ruang terapi Makassar, pasien yang paling lelah mentalnya justru yang paling rajin maksain afirmasi positif, padahal sistem sarafnya butuh rasa aman ragawi.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Pikiranmu nggak butuh kata manis palsu, dia butuh bukti fisik bahwa kamu aman. Balas status ini kalau mau cerita: RESET.",
          visualGuide: {
            headline: "Beri Tubuh Rasa Aman",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Subvocal Rumination: Suara Batin Overthinking Sebenarnya Gerakan Fisik Lidah",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Kepalamu berisik bukan karena pikiranmu rusak, tapi otot lidahmu lagi gerak tanpa sadar.",
          visualGuide: {
            headline: "Gerakan Mikro Lidah",
            badge: "💡 SUARA BATIN OVERTHINKING",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Setiap overthinking di kepala sebenarnya menggerakkan pita suara dan lidah secara mikro tanpa suara keluar.",
          visualGuide: {
            headline: "Loop Pita Suara Batin",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Kekhawatiran Muncul", "Gerak Mikro Pita Suara", "Overthinking Berputar Nonstop"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Trigeminal Jaw Release 60 Detik: Renggangkan rahang, tempelkan lidah ke langit-langit mulut.",
          visualGuide: {
            headline: "Trigeminal Jaw Release",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Buka mulut sedikit agar gigi atas dan bawah tidak rapat", target: "Rahang & Sendi Mulut" },
              { step: "02", action: "Tempelkan ujung lidah rileks ke langit-langit mulut atas", target: "Otot Lidah & Laring" },
              { step: "03", action: "Tahan 30 detik. Rasakan suara berisik di kepala langsung senyap", target: "Pita Suara Hening" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Sebagai praktisi dan solo developer di Makassar: begitu gerakan mikro lidah dihentikan, loop overthinking di kepala mati otomatis seperti kabel dicabut.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Kepalamu layak istirahat dari suara batin yang melelahkan malam ini. Balas status ini kalau mau ngobrol santai: RESET.",
          visualGuide: {
            headline: "Hentikan Suara di Kepala",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "People Pleasing Adalah Respon Saraf Fawn: Kenapa Sulit Berkata Tidak Bukan Masalah Percaya Diri?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Selalu nggak enakan sama orang bukan sifat bawaan, tapi alarm bertahan hidup.",
          visualGuide: {
            headline: "Bukan Kurang Pede",
            badge: "💡 RESPON SARAF FAWN",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Waktu kecil terbiasa takut penolakan, sistem saraf otomatis aktifkan respon Fawn: ngorbanin diri demi ketenangan sekitar.",
          visualGuide: {
            headline: "Respon Fawn Purba",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Takut Ditolak Orang", "Respon Saraf Fawn Aktif", "Selalu Mengalah & Menuruti"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Throat & Jaw Release 60 Detik: Tarik dagu sedikit ke belakang, rilekskan tenggorokan, embuskan napas 'ahhh'.",
          visualGuide: {
            headline: "Throat & Jaw Release",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Tempelkan telapak tangan kanan di dada tengah, rasakan hangatnya", target: "Dada Tengah" },
              { step: "02", action: "Tarik napas perlahan, hembuskan bersuara lembut 'ahhh'", target: "Pita Suara & Laring" },
              { step: "03", action: "Katakan dalam hati: 'Aku aman meski berkata tidak'", target: "Saraf Vagal Ventral" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Catatan meja terapi Makassar: rasa bersalah saat menolak ajakan hilang bukan lewat motivasi percaya diri, melainkan saat saraf merasa aman dari penolakan.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Bikin batasan diri itu bukan kejahatan, tapi caramu menyayangi raga. Balas status ini kalau lelah selalu mengalah: RESET.",
          visualGuide: {
            headline: "Batasan Adalah Perlindungan",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Beban Emosi Terpendam: Kenapa Masalah Batin Sering Lari ke Lambung & Dada?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Sering nelan amarah dan perasaan sendiri? Jangan heran kalau lambung ikut meradang.",
          visualGuide: {
            headline: "Emosi Menjadi Perih",
            badge: "💡 EMOSI & LAMBUNG",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saluran cerna punya jutaan sel saraf. Saat emosi ditahan paksa, saraf enterik lambung yang menanggung bebannya.",
          visualGuide: {
            headline: "Beban Saraf Enterik",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Amarah Dipendam Paksa", "Saraf Lambung Menegang", "Asam Lambung & Begah Kambuh"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Diaphragmatic Sigh 60 Detik: Letakkan tangan di ulu hati, ambil 2 napas pendek, hembuskan lega.",
          visualGuide: {
            headline: "Diaphragmatic Sigh",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Letakkan tangan di perut atas tepat di bawah ulu hati", target: "Ulu Hati & Diafragma" },
              { step: "02", action: "Tarik napas 2 kali pendek lewat hidung sampai perut ngembang", target: "Paru-paru & Perut" },
              { step: "03", action: "Hembuskan panjang lewat mulut sambil rilekskan perut", target: "Saraf Enterik Tenang" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien di Makassar sembuh dari sakit maag menahun setelah berani melepaskan beban rasa bersalah yang dipendam belasan tahun.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Boleh kok merasa lelah dan rapuh. Istirahatkan bebanmu malam ini. Balas status ini kalau ada yang mau dicurhatkan: RESET.",
          visualGuide: {
            headline: "Izin Menjadi Manusia",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Kenapa Saat Hidup Mulai Tenang, Batin Malah Cemas dan Takut Bahagia?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Pas hidup lagi damai-damainya, kenapa malah kepikiran hal buruk atau takut celaka?",
          visualGuide: {
            headline: "Takut Saat Tenang",
            badge: "💡 ANOMALI PIKIRAN",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saraf yang terbiasa hidup was-was menganggap rasa tenang sebagai hal asing yang mencurigakan.",
          visualGuide: {
            headline: "Sabotase Diri Batin",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Keadaan Tenang & Sukses", "Otak Anggap Hal Asing", "Sabotase Batin Muncul"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Somatic Safety Anchoring 60 Detik: Sentuh kedua telapak kaki rata menapak di lantai sambil bernapas pelan.",
          visualGuide: {
            headline: "Somatic Safety Anchoring",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Sentuh kedua telapak kaki rata menapak di lantai", target: "Telapak Kaki Grounding" },
              { step: "02", action: "Tarik napas pelan 4 detik, tahan 2 detik, buang 6 detik", target: "Pola Napas Penenang" },
              { step: "03", action: "Rasakan bahwa detik ini tubuhmu aman merasakan kebaikan", target: "Toleransi Saraf Bahagia" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar, banyak pengusaha merasa gelisah bukan karena rugi, tapi karena sarafnya panik saat rekeningnya mulai stabil.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Kamu pantas bahagia dan tenang tanpa rasa was-was. Balas status ini kalau mau ngobrol santai: RESET.",
          visualGuide: {
            headline: "Perluas Ruang Tenang",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
  ],

  TEKNOLOGI: [
    {
      topic: "Kenapa Kata Motivasi Sering Gagal Menenangkan Pikiran yang Kacau?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Lagi pusing disuruh 'tetap semangat'? Otakmu bukan kurang motivasi, sistem sarafmu yang lagi kepanasan.",
          visualGuide: {
            headline: "Bukan Kurang Motivasi",
            badge: "⚡ KUNCIAN BATIN",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Pola cemas terbentuk dari kebiasaan menahun. Mengubahnya butuh pembiasaan fisik nyata, bukan sekadar kata mutiara.",
          visualGuide: {
            headline: "Kebiasaan Menahun Batin",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Kebiasaan Menahun", "Saraf Mengunci Pola Lama", "Butuh Pembiasaan Nyata"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Physiological Sigh 60 Detik: Ambil dua tarikan napas pendek cepat lewat hidung, hembuskan panjang lewat mulut.",
          visualGuide: {
            headline: "Physiological Sigh 60s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Tarik dua napas pendek cepat lewat hidung", target: "Alveoli Paru" },
              { step: "02", action: "Hembuskan napas panjang perlahan lewat mulut", target: "Saraf Vagus" },
              { step: "03", action: "Rasakan prosesor otakmu langsung terasa lebih adem", target: "Gelombang Otak Kalem" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Sebagai praktisi dan solo dev AI di Makassar: mengubah pola batin butuh input data somatik berulang, bukan sekadar kata afirmasi di permukaan.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Otakmu nggak rusak, cuma butuh istirahat malam ini. Balas status ini kalau kepalamu masih berat: FOKUS.",
          visualGuide: {
            headline: "Rehatkan Pikiran Malam Ini",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Beban Pikiran Menggantung: Kenapa Kepala Terasa Buntu Bukan Karena Bodoh, Tapi Kebanyakan Tugas Mengganjal?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Kepala terasa buntu dan lambat mikir? Otakmu lagi kebanyakan beban yang belum tuntas.",
          visualGuide: {
            headline: "Memori Kerja Meluap",
            badge: "⚡ BEBAN KERJA MENTAL",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Setiap urusan yang menggantung terus menyedot energi mental di latar belakang tanpa kamu sadari.",
          visualGuide: {
            headline: "Beban Latar Belakang",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Tugas Menggantung", "Sedot Energi Mental", "Otak Hang & Brain Fog"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Mental Task Dump 60 Detik: Tuliskan 3 hal yang paling mengganjal kepala di secarik kertas, lalu balik posisinya.",
          visualGuide: {
            headline: "Mental Task Dump 60s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Ambil kertas, tulis 3 hal yang paling mengganjal kepala", target: "Memori Kerja Otak" },
              { step: "02", action: "Tutup kertas rapat-rapat atau balik posisinya ke bawah", target: "Visual Boundary" },
              { step: "03", action: "Tarik napas lega, beri tahu otak tugas sudah dicatat aman", target: "Beban RAM Bebas" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Programmer di Makassar datang dengan keluhan brain fog parah: begitu beban mentalnya dipindahkan ke kertas, kecepatan fokusnya balik 3 kali lipat.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tutup semua beban di kepalamu malam ini. Besok ada tenaga baru. Balas status ini kalau mau cerita: FOKUS.",
          visualGuide: {
            headline: "Bersihkan Pikiran Malam Ini",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Trauma Masa Lalu: Kenapa Kegagalan Kemarin Selalu Menghantui Langkah Hari Ini?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Pernah gagal sekali lalu takut nyoba lagi selamanya? Batinmu trauma, bukan bakatmu yang habis.",
          visualGuide: {
            headline: "Trauma Menghambat Langkah",
            badge: "⚡ KUNCIAN TRAUMA",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otak purba menghafal luka masa lalu terlalu kuat, sampai lupa melihat kalau keadaan sekarang sudah jauh lebih aman.",
          visualGuide: {
            headline: "Terjebak Luka Lama",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Luka di Masa Lalu", "Otak Mengunci Ingatan", "Takut Melangkah Hari Ini"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Context Switch Somatik 60 Detik: Sentuh 3 benda nyata di sekitarmu, sebut warnanya, lirikkan mata ke kanan 30 detik.",
          visualGuide: {
            headline: "Context Switch Somatik",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Lihat sekeliling, sebutkan 3 benda nyata di depanmu", target: "Korteks Visual Sadar" },
              { step: "02", action: "Sentuh permukaan meja atau kursi, rasakan teksturnya", target: "Sensorik Sentuhan" },
              { step: "03", action: "Lirikkan mata ke kanan 30 detik untuk update konteks hari ini", target: "Saraf Hadir Masa Kini" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar: klien yang takut bicara di depan umum lepas dari trauma begitu sarafnya sadar situasi sekarang sudah beda panggung.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Hari ini bukan masa lalumu. Biarkan batinmu bernapas lega. Balas status ini kalau mau ngobrol santai: FOKUS.",
          visualGuide: {
            headline: "Data Baru Penuh Harapan",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Lelah Scroll HP: Kenapa Buka Medsos Seharian Bikin Badan Lebih Lemas dari Kerja Fisik?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Rebahan seharian scroll video pendek tapi badan malah lemas nggak bertenaga?",
          visualGuide: {
            headline: "Lelah Tanpa Gerak",
            badge: "⚡ CRASH ENERGI",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Tiap swipe layar memicu rangsangan instan beruntun. Begitu berhenti, otak membanting level energi ke titik terendah.",
          visualGuide: {
            headline: "Baterai Mental Anjlok",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Swipe Konten Cepat", "Rangsangan Berlebih", "Energi Mental Anjlok Drop"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Screen Fast Reset 60 Detik: Balik layar ponsel ke bawah, pandang titik terjauh di luar jendela selama 60 detik.",
          visualGuide: {
            headline: "Screen Fast Reset 60s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Balik layar ponsel ke bawah atau simpan di balik bantal", target: "Batas Visual Layar" },
              { step: "02", action: "Tatap titik terjauh di luar jendela selama 60 detik santai", target: "Otot Mata Rileks" },
              { step: "03", action: "Tarik napas panjang lewat hidung, rasakan ketenangan kembali", target: "Reseptor Dopamin Pulih" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar, pecandu gadget yang merasa burnout pulih energinya drastis hanya dengan jeda visual tanpa layar sebelum tidur.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Jauhkan layar sejenak malam ini dan biarkan matamu istirahat alami. Balas status ini kalau mau ngobrol: FOKUS.",
          visualGuide: {
            headline: "Ketenangan Alami Malam Hari",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
    {
      topic: "Kenapa Pikiran Selalu Meramalkan Hal Buruk yang Sebenarnya Tak Pernah Terjadi?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Otak kita bukan kamera perekam, melainkan mesin peramal yang sering menakut-nakuti diri sendiri.",
          visualGuide: {
            headline: "Mesin Peramal Batin",
            badge: "⚡ RAMALAN CEMAS",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otak purba bertahan hidup dengan menebak skenario terburuk. 90% ketakutanmu cuma karangan pikiran sendiri.",
          visualGuide: {
            headline: "Halusinasi Ancaman",
            badge: "🔬 SKEMA SEBAB - AKIBAT",
            flowchart: ["Informasi Masuk Otak", "Menebak Skenario Terburuk", "Tubuh Panik Duluan"],
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Reality Alignment 60 Detik: Ambil dua napas pendek lewat hidung, lalu tanyakan tubuh apakah detik ini ada bahaya fisik nyata.",
          visualGuide: {
            headline: "Reality Alignment 60s",
            badge: "⚡ PRAKTIK 60 DETIK",
            steps: [
              { step: "01", action: "Ambil dua napas pendek cepat lewat hidung (Physiological Sigh)", target: "Detak Jantung Kalem" },
              { step: "02", action: "Tanyakan tubuh: 'Detik ini, apakah aku dalam bahaya fisik nyata?'", target: "Korteks Sadar" },
              { step: "03", action: "Rasakan jawaban tubuh yang tenang bahwa saat ini kamu aman", target: "Alarm Halusinasi Mati" },
            ],
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien psikosomatis Makassar gemetar tiap membaca berita duka. Begitu mekanisme pikiran diurai, serangan paniknya berhenti seketika.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            badge: "📋 CATATAN MEJA TERAPI",
            stamp: "TERVERIFIKASI SOMATIK • MAKASSAR",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Pikiranmu meramal badai, tapi kamarmu malam ini aman dan teduh. Balas status ini kalau butuh teman ngobrol: FOKUS.",
          visualGuide: {
            headline: "Kamarmu Aman dan Teduh",
            badge: "🌙 CATATAN REFLEKSI MALAM",
          },
        },
      ],
    },
  ],
};

const CURATED_STORIES = {
  TUBUH: CURATED_VARIATIONS.TUBUH[0],
  PIKIRAN: CURATED_VARIATIONS.PIKIRAN[0],
  TEKNOLOGI: CURATED_VARIATIONS.TEKNOLOGI[0],
};

const ACTIVE_DAILY_FILE = path.join(process.cwd(), "data", "active-daily-story.json");

/**
 * Membaca data naskah aktif hari ini dari cache file
 */
function getActiveDailyStory(expectedDateStr = null) {
  try {
    if (!fs.existsSync(ACTIVE_DAILY_FILE)) return null;
    const content = fs.readFileSync(ACTIVE_DAILY_FILE, "utf-8");
    const data = JSON.parse(content);
    if (expectedDateStr && data.date !== expectedDateStr) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Menyimpan data naskah aktif hari ini ke cache file
 */
function saveActiveDailyStory(storyData) {
  try {
    const dir = path.dirname(ACTIVE_DAILY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ACTIVE_DAILY_FILE, JSON.stringify(storyData, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("⚠️ Gagal menyimpan active-daily-story.json:", err.message);
    return false;
  }
}

/**
 * Mendapatkan kurasi dinamis berdasarkan tanggal dan parameter seed
 */
function getCuratedStoryForDate(pillarKey = "TUBUH", targetDate = new Date(), seed = null) {
  const pil = (pillarKey || "TUBUH").toUpperCase();
  const variations = CURATED_VARIATIONS[pil] || CURATED_VARIATIONS.TUBUH;
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const dayNum = d.getDate();
  const monthNum = d.getMonth() + 1;
  const yearNum = d.getFullYear();
  const dateHash = Math.abs(yearNum * 372 + monthNum * 31 + dayNum);

  let idx;
  if (seed !== null && seed !== undefined) {
    idx = Math.abs(Number(seed)) % variations.length;
  } else {
    idx = dateHash % variations.length;
  }

  return variations[idx] || variations[0];
}

/**
 * Menyimpan data story terbaru ke cache lokal file untuk sinkronisasi PDF dinamis
 */
function cacheLatestStory(storyData) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dataDir, "latest-story.json"),
      JSON.stringify(storyData, null, 2),
      "utf-8"
    );
    if (storyData.pillar) {
      fs.writeFileSync(
        path.join(dataDir, `story-${storyData.pillar.toLowerCase()}.json`),
        JSON.stringify(storyData, null, 2),
        "utf-8"
      );
    }
  } catch {
    // Non-blocking pada environment serverless / read-only filesystem
  }
}

/**
 * Jadwal Resmi Mingguan Dokter Pikiran Makassar (WITA, UTC+8)
 * ─────────────────────────────────────────────────────────────
 * Day 1 (Senin) -> TUBUH      | CTA: LAMBUNG (Monday Sickness, Ketegangan Otot, Asam Lambung)
 * Day 2 (Selasa)-> PIKIRAN    | CTA: RESET   (Overthinking, Mental Resistance, Paradoks Positif)
 * Day 3 (Rabu)  -> TEKNOLOGI  | CTA: FOKUS   (Digital Fatigue, Brain Fog, Screen Overload)
 * Day 4 (Kamis) -> TUBUH      | CTA: RELAKSASI (Vagus Nerve, Napas Pendek, Migrain Tegang)
 * Day 5 (Jumat) -> PIKIRAN    | CTA: DAMAI   (Emotional Decompression, Luka Batin, Ketenangan)
 * Day 6 (Sabtu) -> TEKNOLOGI  | CTA: FLOW    (Digital Detox, Insomnia Layar, Biohacking)
 * Day 0 (Ahad)  -> TUBUH      | CTA: PULIH   (Deep Rest, Pemulihan Saraf Otonom, Tidur Lelap)
 */
const MAKASSAR_SCHEDULE = {
  1: { pillar: "TUBUH", keyword: "LAMBUNG", topicHint: "Monday Sickness, Ketegangan Otot, Asam Lambung" },
  2: { pillar: "PIKIRAN", keyword: "RESET", topicHint: "Overthinking, Mental Resistance, Paradoks Positif" },
  3: { pillar: "TEKNOLOGI", keyword: "FOKUS", topicHint: "Digital Fatigue, Brain Fog, Screen Overload" },
  4: { pillar: "TUBUH", keyword: "RELAKSASI", topicHint: "Vagus Nerve, Napas Pendek, Migrain Tegang" },
  5: { pillar: "PIKIRAN", keyword: "DAMAI", topicHint: "Emotional Decompression, Luka Batin, Ketenangan" },
  6: { pillar: "TEKNOLOGI", keyword: "FLOW", topicHint: "Digital Detox, Insomnia Layar, Biohacking" },
  0: { pillar: "TUBUH", keyword: "PULIH", topicHint: "Deep Rest, Pemulihan Saraf Otonom, Tidur Lelap" },
};

/**
 * Mendapatkan hari & jadwal resmi Makassar (WITA / UTC+8)
 */
function getMakassarSchedule(dateInput = new Date()) {
  let targetDate;
  if (typeof dateInput === "string") {
    // Jika format YYYY-MM-DD
    targetDate = new Date(dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00+08:00`);
  } else if (dateInput instanceof Date) {
    targetDate = dateInput;
  } else {
    targetDate = new Date();
  }

  // Gunakan waktu resmi Makassar
  const nowMakassar = new Date(targetDate.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
  const day = nowMakassar.getDay(); // 0 = Ahad, 1 = Senin, ..., 6 = Sabtu
  return {
    day,
    schedule: MAKASSAR_SCHEDULE[day] || MAKASSAR_SCHEDULE[0],
  };
}

/**
 * Menentukan pilar harian secara otomatis berbasis kalender resmi WITA
 */
function resolvePillar(requestedPillar, date = new Date()) {
  if (requestedPillar && PILLARS[requestedPillar.toUpperCase()]) {
    return requestedPillar.toUpperCase();
  }
  const { schedule } = getMakassarSchedule(date);
  return schedule.pillar;
}

/**
 * Menentukan keyword resmi harian berbasis pilar dan kalender resmi WITA
 */
function resolvePillarKeyword(pillarKey, date = new Date()) {
  const { schedule } = getMakassarSchedule(date);
  if (pillarKey && pillarKey.toUpperCase() === schedule.pillar) {
    return schedule.keyword;
  }
  const pil = PILLARS[(pillarKey || "").toUpperCase()];
  return pil?.defaultKeyword || schedule.keyword || "RESET";
}

/**
 * Validasi batas kata pada story
 */
function enforceStoryWordLimits(stories) {
  return stories.map((s) => {
    const copy = { ...s };
    const actUpper = (copy.act || "").toUpperCase();
    if (actUpper.includes("HOOK")) {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 15) {
        copy.text = words.slice(0, 15).join(" ") + "...";
      }
    } else if (actUpper.includes("EDUKASI")) {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 25) {
        copy.text = words.slice(0, 25).join(" ") + "...";
      }
    }
    return copy;
  });
}

/**
 * System prompt V3.0 — Obrolan Santai & Infografis Satori (Makassar)
 */
function buildSystemPrompt(pillarKey) {
  const pilar = PILLARS[pillarKey];
  return `Anda adalah ${BRAND_IDENTITY.creator}, pendiri brand ${BRAND_IDENTITY.brand} di Makassar, WITA (UTC+8).
Persona: ${BRAND_IDENTITY.persona}
Target Audiens: ${BRAND_IDENTITY.audience}
Gaya Bahasa: ${BRAND_IDENTITY.tone}

════════════════════════════════════════════════════════════════════════════════
STANDAR MUTLAK MESIN KONTEN V3.0 (OBROLAN SEHARI-HARI & PARADOXICAL INSIGHT)
════════════════════════════════════════════════════════════════════════════════

1. GAYA BAHASA: OBROLAN SEHARI-HARI AKRAB & MEMBUMI
- Mengobrol seperti teman santai yang sangat paham neurosains di warkop Makassar ("Pernah ngerasa...", "Bukan karena...", "Bayangin tubuh kita kayak...").
- DILARANG menggunakan istilah akademis kaku atau bahasa buku kuliah.
- Jelaskan anomali psikosomatis dengan analogi sederhana yang langsung mengena di kepala pembaca.

2. DAFTAR LARANGAN KERAS (BLACKLIST KLISE):
- DILARANG menyarankan: "Tarik napas dalam-dalam", "Hindari pedas/asam/kopi", "Berpikir positif / jangan stres", atau "Luangkan waktu me-time".

3. STRUKTUR 5 STORY & ELEMEN VISUAL:
- Story 1 (07:00 WITA) - HOOK: Pertanyaan pemantik relate keseharian. MAKSIMAL 15 KATA (STRICT).
  Sertakan visualGuide.badge (misal: "🚨 ANOMALI LAMBUNG").
- Story 2 (07:45 WITA) - EDUKASI: Skema sebab-akibat kenapa tubuh bereaksi sebaliknya. MAKSIMAL 25 KATA (STRICT).
  WAJIB sertakan visualGuide.flowchart berupa array 3 node ringkas [Pemicu, Respon Saraf, Reaksi Fisik] (misal: ["Alarm Otak", "Saraf Freeze", "Klep Terbuka"]).
- Story 3 (13:00 WITA) - PRAKTIK: Panduan 3 langkah visual yang bisa dicoba sambil duduk (Physiological Sigh, Sub-occipital Eye Reset, atau Jaw Release).
  WAJIB sertakan visualGuide.steps berupa array 3 objek: [{ step: "01", action: "...", target: "Titik Tubuh" }, ...].
- Story 4 (20:00 WITA) - BUKTI: Cerita nyata santai dari meja terapi Batua Raya Makassar.
  Sertakan visualGuide.stamp: "TERVERIFIKASI SOMATIK • MAKASSAR".
- Story 5 (21:00 WITA) - CTA HALUS: Refleksi tenang malam hari + ajakan hangat membalas status dengan kata kunci (${pilar.defaultKeyword}) untuk curhat / ngobrol santai (DILARANG menyebut atau menawarkan file PDF).
  Sertakan visualGuide.headline: tema ketenangan malam hari.
  Sertakan visualGuide.badge: "🌙 CATATAN REFLEKSI MALAM".

FORMAT KELUARAN WAJIB HANYA JSON VALID:
{
  "topic": "Judul Naskah Paradoks Hari Ini",
  "keyword": "${pilar.defaultKeyword}",
  "stories": [
    {
      "slide": 1,
      "time": "07:00",
      "act": "HOOK",
      "text": "Pernah ngerasa leher kaku padahal baru bangun tidur?",
      "visualGuide": {
        "headline": "Bukan Salah Bantal",
        "badge": "🚨 ANOMALI TUBUH"
      }
    },
    {
      "slide": 2,
      "time": "07:45",
      "act": "EDUKASI",
      "text": "Bukan karena bantal. Otak mendeteksi bahaya dan mengunci leher sebagai perisai purba.",
      "visualGuide": {
        "headline": "Perisai Saraf Leher",
        "badge": "🔬 SKEMA SEBAB - AKIBAT",
        "flowchart": ["Alarm Otak Aktif", "Saraf Leher Siaga", "Pundak Mengunci"]
      }
    },
    {
      "slide": 3,
      "time": "13:00",
      "act": "PRAKTIK",
      "text": "Lateral Eye & Shoulder Drop 60 Detik sambil duduk santai.",
      "visualGuide": {
        "headline": "Lateral Shoulder Drop",
        "badge": "⚡ PRAKTIK 60 DETIK",
        "steps": [
          { "step": "01", "action": "Sentuh tengkuk belakang dengan satu telapak tangan lembut", "target": "Otot Trapezius" },
          { "step": "02", "action": "Lirikkan mata ke sudut kiri atas 30 detik tanpa menoleh", "target": "Saraf Kranial Leher" },
          { "step": "03", "action": "Hembuskan napas panjang dan rasakan kedua bahu turun", "target": "Bahu Turun Rileks" }
        ]
      }
    },
    {
      "slide": 4,
      "time": "20:00",
      "act": "BUKTI",
      "text": "Kemarin di meja terapi Batua Raya Makassar, pasien ngeluh leher kaku 3 tahun. Begitu kuncian sarafnya dilepas, lehernya langsung enteng.",
      "visualGuide": {
        "headline": "Catatan Meja Terapi Makassar",
        "badge": "📋 CATATAN MEJA TERAPI",
        "stamp": "TERVERIFIKASI SOMATIK • MAKASSAR"
      }
    },
    {
      "slide": 5,
      "time": "21:00",
      "act": "CTA HALUS",
      "text": "Tanggalkan baju zirahmu malam ini. Beri izin tubuhmu rehat. Balas status ini kalau mau ngobrol santai: ${pilar.defaultKeyword}.",
      "visualGuide": {
        "headline": "Lepaskan Perisai Malam Ini",
        "badge": "🌙 CATATAN REFLEKSI MALAM"
      }
    }
  ]
}`;
}

/**
 * Generate 5 Story V3.0
 */
async function generateStoryV2(options = {}) {
  const targetDate = options.date ? new Date(options.date) : new Date();
  const pillarKey = resolvePillar(options.pillar, targetDate);
  const pilar = PILLARS[pillarKey];
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const userTopic = (options.topic || options.customTopic || options.rawThought || "").trim();

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Makassar",
  }).format(targetDate);

  const entropySeed =
    options.seed !== undefined && options.seed !== null
      ? Number(options.seed)
      : Math.floor(Math.random() * 1000000);

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(pillarKey);
    let userPrompt = `Buatkan 5 babak Story WhatsApp Dokter Pikiran V3.0 untuk hari ini tanggal ${dateStr} WITA dengan pilar ${pillarKey}.
Lokasi Resmi: Makassar, WITA (UTC+8).
Seed Acak: ${entropySeed}-${Date.now()}.
Gaya Bahasa Wajib: Obrolan santai, hangat, akrab seperti mengobrol di warkop Makassar ("Pernah ngerasa...", "Bukan karena...", "Bayangin tubuh kita kayak...").
Format Wajib:
1. Story 1: Hook pertanyaan keseharian (max 15 kata).
2. Story 2: Skema sebab-akibat (max 25 kata) + visualGuide.flowchart (3 node).
3. Story 3: Praktik 60 detik sambil duduk + visualGuide.steps (3 langkah dengan titik tubuh).
4. Story 4: Kasus santai dari meja terapi Batua Raya Makassar + stamp somatik.
5. Story 5: Refleksi malam tenang + ajakan hangat membalas status dengan kata kunci ${pilar.defaultKeyword} untuk ngobrol santai/curhat (TANPA PDF).`;

    if (userTopic) {
      userPrompt += `\n\nFOKUS TOPIK DARI USER:\n"${userTopic}"\nBuat naskah yang berfokus mendalam pada topik ini sesuai gaya santai & wawasan paradoks V3.0 Makassar.`;
    }

    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.9,
          },
        });

        const rawText = response.text ? response.text.trim() : "";
        if (rawText) {
          let cleaned = rawText;
          const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (match) cleaned = match[1].trim();

          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed.stories) && parsed.stories.length === 5) {
            const sanitizedStories = enforceStoryWordLimits(parsed.stories);
            const result = {
              success: true,
              date: dateStr,
              pillar: pillarKey,
              pillarTitle: pilar.title,
              themeColor: pilar.themeColor,
              accentColor: pilar.accentColor,
              topic: userTopic || parsed.topic || pilar.title,
              keyword: parsed.keyword || pilar.defaultKeyword,
              source: "gemini",
              model,
              stories: sanitizedStories,
            };
            cacheLatestStory(result);
            saveActiveDailyStory(result);
            return result;
          }
        }
      } catch (err) {
        console.warn(`[StoryEngineV3] Model ${model} gagal:`, err.message || err);
      }
    }
  }

  // Fallback Kurasi Dinamis Berkualitas Tinggi V3.0 (Obrolan Santai Makassar)
  const curated = getCuratedStoryForDate(
    pillarKey,
    targetDate,
    options.seed || (options.fresh ? Math.floor(Math.random() * 100) : null)
  );

  const officialKeyword = resolvePillarKeyword(pillarKey, targetDate);

  const fallbackStories = curated.stories.map((s, idx) => {
    let text = s.text;
    if (userTopic && idx === 0) {
      return {
        ...s,
        text: `Pernah ngerasa ${userTopic}? Tubuhmu nggak malas, alarm sarafmu lagi siaga.`,
        visualGuide: {
          ...s.visualGuide,
          headline: userTopic.length > 25 ? userTopic.slice(0, 25) + "..." : userTopic,
        },
      };
    }
    // Pastikan CTA Story 5 menggunakan keyword resmi jadwal hari ini
    if (idx === 4 && officialKeyword) {
      text = text.replace(/Balas story ini:\s*[A-Z]+/i, `Balas story ini: ${officialKeyword}`);
    }
    return {
      ...s,
      text,
    };
  });

  const sanitizedFallback = enforceStoryWordLimits(fallbackStories);
  const result = {
    success: true,
    date: dateStr,
    pillar: pillarKey,
    pillarTitle: pilar.title,
    themeColor: pilar.themeColor,
    accentColor: pilar.accentColor,
    topic: userTopic || curated.topic,
    keyword: officialKeyword || curated.keyword,
    source: "curated_fallback",
    model: "DokterPikiran-Curated-V3.0-Makassar",
    stories: sanitizedFallback,
  };
  cacheLatestStory(result);
  saveActiveDailyStory(result);
  return result;
}

module.exports = {
  BRAND_IDENTITY,
  PILLARS,
  MAKASSAR_SCHEDULE,
  getMakassarSchedule,
  resolvePillarKeyword,
  CURATED_STORIES,
  CURATED_VARIATIONS,
  getCuratedStoryForDate,
  resolvePillar,
  enforceStoryWordLimits,
  generateStoryV2,
  cacheLatestStory,
  getActiveDailyStory,
  saveActiveDailyStory,
};

