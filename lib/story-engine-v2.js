/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.3 — AI Engine (lib/story-engine-v2.js)
 *  Brand: Dokter Pikiran (Ahmad Jawahir Zain)
 * ════════════════════════════════════════════════════════════════════════════
 *  Revisi V2.3:
 *  - Koreksi Lokasi Resmi Brand: Makassar, WITA (UTC+8).
 *  - Paradoxical Insight & Anti-Generic Knowledge.
 *  - Daftar Larangan Keras (Blacklist Klise Wellness: anti-napas biasa, anti-diet kopi/pedas, anti-berpikir positif, anti-me time).
 *  - The Paradoxical Truth: Anomali biologis & psikologis nyata yang membalikkan asumsi awam.
 *  - Teknik Somatik Mikro 60 Detik Nyata: Physiological Sigh, Sub-occipital Lateral Eye Reset, Jaw Release / Trigeminal Unclench.
 *  - Struktur Format Ketat 5 Story: Hook <= 15 kata, Edukasi <= 25 kata, Bukti meja terapi Makassar, CTA Halus PDF.
 *  - Sinkronisasi Data Story untuk PDF Dinamis.
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
    "Hipnoterapis klinis & solo developer AI di Makassar, WITA (UTC+8) yang mengurai anomali biologis dan psikologis bawah sadar secara membumi, berbasis sains sistem saraf nyata tanpa klise motivasi murahan.",
  audience:
    "Pria & wanita usia 25-45 tahun yang lelah dengan tips wellness pasaran, mengalami psikosomatis (asam lambung, sesak, insomnia, leher kaku), dan mencari akar biologis-psikologis yang nyata.",
  tone:
    "Otoritas tinggi, hangat, membumi, membuka mata lewat wawasan paradoks (paradoxical insight), tajam, tanpa istilah medis akademis yang membingungkan, dan anti-klise.",
};

// 3 Pilar Konten Mutlak (1 pilar per hari, tidak boleh campur)
const PILLARS = {
  PIKIRAN: {
    key: "PIKIRAN",
    title: "Bawah Sadar, Belief System & Suara Batin",
    description: "Mengurai error mismatch afirmasi positif, subvocal rumination, dan pemutusan alarm bawah sadar.",
    defaultKeyword: "RESET",
    themeColor: "#1E293B", // Muted Dark Slate
    accentColor: "#FDE047", // Warm Gold
  },
  TUBUH: {
    key: "TUBUH",
    title: "Gut-Brain, Sistem Saraf & Paradoks Tubuh",
    description: "Anomali klep asam lambung, relaxation-induced anxiety, sleep effort paradox, dan kuncian saraf somatik.",
    defaultKeyword: "LAMBUNG",
    themeColor: "#1B2E24", // Deep Forest Sage
    accentColor: "#86EFAC", // Soft Mint Green
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    title: "Arsitektur Otak, Pre-trained Weights & Overthinking",
    description: "Analogi pre-trained weights bawah sadar, fine-tuning sistem saraf, dan pembersihan background process otak.",
    defaultKeyword: "FOKUS",
    themeColor: "#17202A", // Deep Charcoal Slate
    accentColor: "#93C5FD", // Soft Blue Ice
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5 Variasi Topik Paradoks Per Pilar (Anti-Stale & Dynamic Fallback V2.3)
// ════════════════════════════════════════════════════════════════════════════
const CURATED_VARIATIONS = {
  TUBUH: [
    {
      topic: "Relaxation-Induced Anxiety: Kenapa Saat Rebahan Tubuh Malah Makin Gelisah & Migrain?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Niat santai dan rebahan, tapi dada malah berdebar dan asam lambung melilit?",
          visualGuide: {
            headline: "Relaxation Anxiety",
            palette: "Forest Sage & Mint",
            elements: "Visual minimalis paradoks tubuh yang gelisah saat istirahat",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saraf terbiasa siaga tinggi kronis. Penurunan hormon stres mendadak dibaca otak bawah sadar sebagai ancaman bahaya sebelum badai.",
          visualGuide: {
            headline: "Alarm Sebelum Badai",
            palette: "Forest Sage & Warm Linen",
            elements: "Highlight box penarikan hormon stres mendadak",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Physiological Sigh 60 Detik: Ambil dua tarikan napas pendek cepat lewat hidung, hembuskan satu tarikan panjang lewat mulut. Alveoli paru mekar seketika.",
          visualGuide: {
            headline: "Physiological Sigh",
            palette: "Sage Green & Sand",
            elements: "Langkah fisiologis 2 tarikan pendek dan 1 hembusan panjang lega",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Catatan meja terapi Makassar: profesional yang selalu dispepsia tiap hari libur. Masalahnya bukan lambung, tapi sarafnya belum diajari bahwa hening itu aman.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Forest Muted",
            elements: "Kutipan refleksi psikosomatis dari ruang klinik Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tenang bukan berarti kehilangan kendali. Beri izin tubuhmu menurunkan perisai malam ini. Mau panduan PDF Menjinakkan Cemas Saat Rehat? Balas story ini: LAMBUNG.",
          visualGuide: {
            headline: "Izin untuk Rehat Aman",
            palette: "Night Forest & Soft Sand",
            elements: "Pesan penutup malam tenang dengan pemicu keyword LAMBUNG",
          },
        },
      ],
    },
    {
      topic: "Sleep Effort Paradox: Semakin Dipaksa Tidur Cepat, Kenapa Otak Malah Makin Terjaga?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Makin keras kamu berusaha tidur cepat, makin benderang amigdala menolak untuk lelap.",
          visualGuide: {
            headline: "Paradoks Memaksa Tidur",
            palette: "Forest Sage & Dark Obsidian",
            elements: "Tipografi tajam tentang anomali upaya tidur",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Tidur adalah pelepasan kendali pasif. Memaksa tidur dibaca otak sebagai tugas darurat sadar, memicu hormon kewaspadaan kortisol.",
          visualGuide: {
            headline: "Usaha Sadar Memicu Siaga",
            palette: "Deep Sage & Soft Gold",
            elements: "Diagram mekanisme kebalikan upaya sadar vs rasa kantuk alami",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Sub-occipital Eye Reset 60 Detik: Baring telentang, lirikkan mata ke kanan penuh 30 detik tanpa menoleh sampai ada reflek menguap atau menelan.",
          visualGuide: {
            headline: "Sub-occipital Eye Reset",
            palette: "Sage & Sand",
            elements: "Manuver reset saraf kranial dan pelepas alarm siaga tidur",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Pasien insomnia Makassar berbulan-bulan minum herbal tanpa hasil. Begitu berhenti memaksakan tidur dan merilekskan saraf tengkuk, ia tertidur pulas dalam 10 menit.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Muted Forest Night",
            elements: "Kutipan keberhasilan pelepasan kendali tidur di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Malam ini jangan tuntut dirimu tertidur, cukup biarkan kasur menopang berat ragamu seutuhnya. Mau panduan PDF Matikan Alarm Insomnia Bawah Sadar? Balas story ini: LAMBUNG.",
          visualGuide: {
            headline: "Lepaskan Tuntutan Tidur",
            palette: "Night Deep Forest & Soft Linen",
            elements: "Pesan hangat penutup malam dengan pemicu keyword LAMBUNG",
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
          text: "Pundakmu kaku seperti batu bukan karena salah bantal, tapi sarafmu membeku menahan ancaman.",
          visualGuide: {
            headline: "Kuncian Pundak Purba",
            palette: "Deep Sage & Linen",
            elements: "Tipografi tegas mengenai asal ketegangan leher",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otot trapezius terhubung saraf kranial aksesorius. Saat batin memikul ancaman terpendam, pundak mengunci otomatis sebagai perisai leher purba.",
          visualGuide: {
            headline: "Perisai Biologis Leher",
            palette: "Forest Sage & Muted Green",
            elements: "Highlight box jalur saraf aksesorius dan postur perlindungan diri",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Lateral Eye & Shoulder Drop 60 Detik: Sentuh tengkuk belakang, lirikkan mata ke kiri ekstrem 30 detik sampai bahu turun 2 sentimeter secara spontan.",
          visualGuide: {
            headline: "Lateral Eye & Shoulder Drop",
            palette: "Sage Green & Sand",
            elements: "Panduan praktis pelepasan otot trapezius lewat lirikkan mata",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar: puluhan sesi pijat hanya bertahan dua hari jika alam bawah sadar terus merasa memikul tanggung jawab yang bukan porsinya.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Forest Muted",
            elements: "Catatan klinis hubungan beban psikologis dan kaku leher",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tanggalkan baju zirahmu malam ini, kamu tidak sedang berada di medan perang. Mau panduan PDF Melepas Kuncian Saraf Pundak & Tengkuk? Balas story ini: LAMBUNG.",
          visualGuide: {
            headline: "Tanggalkan Perisai Malam Ini",
            palette: "Night Forest & Soft Sand",
            elements: "Pesan hangat melepas beban leher dengan keyword LAMBUNG",
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
          text: "Dada terasa sesak lalu kamu tarik napas dalam-dalam? Itu justru bikin oksigen gagal diserap.",
          visualGuide: {
            headline: "Paradoks Tarik Napas",
            palette: "Sage & Linen White",
            elements: "Pertanyaan menusuk membongkar mitos tarik napas dalam",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Menarik napas berlebihan membuang karbon dioksida terlalu cepat, menyempitkan pembuluh darah dan membuat otak merasa makin tercekik.",
          visualGuide: {
            headline: "Efek Bohr & Gas Darah",
            palette: "Forest Sage & Soft Gold",
            elements: "Diagram ilmiah sederhana penyempitan pembuluh darah saat hiperventilasi",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Exhale Prolongation 60 Detik: Hirup udara pelan 2 detik lewat hidung, lalu hembuskan lembut 6 detik lewat bibir mengerucut. Keseimbangan gas darah pulih.",
          visualGuide: {
            headline: "Exhale Prolongation 6s",
            palette: "Sage Green & Sand",
            elements: "Instruksi pernapasan rasio 1:3 untuk mengembalikan CO2 darah",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien klinik Makassar sering panik mengira serangan jantung saat lambung bergejolak. Begitu pola hembusan diperpanjang, sesak dada lenyap seketika tanpa obat penenang.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Forest Muted",
            elements: "Kasus nyata sesak psikosomatis yang pulih lewat hembusan panjang",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tubuhmu tidak kekurangan udara, ia hanya perlu berhenti bertarung melawan rasa sesak. Mau panduan PDF Atasi Sesak Napas Psikosomatis? Balas story ini: LAMBUNG.",
          visualGuide: {
            headline: "Berhenti Bertarung Melawan Sesak",
            palette: "Night Forest & Linen",
            elements: "Pesan penutup tenang dengan pemicu keyword LAMBUNG",
          },
        },
      ],
    },
    {
      topic: "Kenapa Asam Lambung Kambuh Justru Bukan Karena Kelebihan Asam?",
      keyword: "LAMBUNG",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Asam lambung perih saat cemas? Lambungmu bukan kelebihan asam, tapi kekurangan asam.",
          visualGuide: {
            headline: "Paradoks Asam Lambung",
            palette: "Forest Sage & Warm Linen",
            elements: "Kartu 9:16 minimalis berwibawa, membongkar mitos asam lambung",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saat saraf siaga aktif, lambung kekurangan asam. Klep esofagus gagal mengunci rapat, sehingga uap asam bocor ke dada.",
          visualGuide: {
            headline: "Klep Gagal Mengunci",
            palette: "Forest Sage & Mint",
            elements: "Highlight box mekanisme katup lambung saat saraf simpatik aktif",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Jaw Release 60 Detik: Renggangkan rahang, buka mulut santai, lalu tempelkan ujung lidah ke langit-langit mulut. Ini memutus sinyal darurat lambung seketika.",
          visualGuide: {
            headline: "Trigeminal Jaw Release",
            palette: "Sage Green & Sand",
            elements: "Instruksi manuver pelepasan saraf trigeminal rahang dan lambung",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Kasus meja terapi Makassar: bertahun-tahun pasien menghindari kopi dan pantang makan, tapi lambung tetap perih. Begitu kuncian saraf rahang dan alarm paniknya direset, keluhan asamnya lenyap.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Forest Muted",
            elements: "Kutipan refleksi nyata anomali tubuh dari meja terapi Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Lambungmu bukan musuh, dia hanya merespons alarm darurat yang belum kamu matikan. Malam ini istirahatkan sarafmu. Mau panduan PDF 60 Detik Atasi Asam Lambung Psikosomatis? Balas story ini: LAMBUNG.",
          visualGuide: {
            headline: "Istirahatkan Saraf Malam Ini",
            palette: "Night Forest & Soft Sand",
            elements: "Pesan penutup tenang dengan pemicu keyword LAMBUNG",
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
          text: "Memaksa afirmasi positif saat cemas membuat otak membacanya sebagai ancaman kebohongan.",
          visualGuide: {
            headline: "Paradoks Afirmasi Positif",
            palette: "Dark Slate & Warm Sand",
            elements: "Kartu 9:16 minimalis elegan dengan tanda kutip filosofis",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Bawah sadar mendeteksi ancaman. Saat panik dipaksa tenang, otak mendeteksi error mismatch dan menaikkan alarm bahaya berlipat ganda.",
          visualGuide: {
            headline: "Error Mismatch Batin",
            palette: "Dark Slate dengan aksen Gold",
            elements: "Analogi pendeteksi error sistem logika dan alarm bawah sadar",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Sub-occipital Eye Reset 60 Detik: Tanpa menolehkan kepala, lirikkan bola mata ke sudut kanan selama 30 detik sampai ada reflek menguap atau menelan. Kuncian saraf leher belakang langsung lepas.",
          visualGuide: {
            headline: "Lateral Eye Reset",
            palette: "Forest Slate & Linen",
            elements: "Manuver lateral bola mata untuk mereset kuncian saraf leher",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di ruang terapi Makassar, mereka yang paling lelah mentalnya justru yang paling rajin memaksakan afirmasi positif tiap pagi, padahal sistem sarafnya sedang freeze dan butuh rasa aman ragawi.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Muted Slate hangat",
            elements: "Refleksi mendalam kasus penolakan bawah sadar dari Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Pikiranmu tidak butuh kata manis palsu, dia hanya butuh sinyal fisik bahwa kamu aman. Malam ini izinkan dirimu tenang. Mau panduan PDF Reset Sistem Saraf Bawah Sadar? Balas story ini: RESET.",
          visualGuide: {
            headline: "Beri Tubuh Rasa Aman",
            palette: "Night Deep Slate & Warm Sand",
            elements: "Pesan reflektif malam dengan pemicu keyword RESET",
          },
        },
      ],
    },
    {
      topic: "Subvocal Rumination: Suara Batin Overthinking Sebenarnya Gerakan Fisik Pita Suara",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Kepalamu berisik bukan karena pikiranmu rusak, tapi otot lidahmu sedang bergerak mikro.",
          visualGuide: {
            headline: "Gerakan Mikro Laring",
            palette: "Slate Dark & Ice Blue",
            elements: "Ilustrasi anatomi konseptual pita suara dan pikiran",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otak berpikir lewat subvokalisasi kontraksi otot laring halus. Menghentikan monolog cemas bukan melawan pikiran, tapi merelaksasikan otot bicara.",
          visualGuide: {
            headline: "Subvocal Rumination",
            palette: "Dark Slate & Soft Cyan",
            elements: "Diagram transmisi sinyal dari laring ke pusat kecemasan",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Jaw & Tongue Unclench 60 Detik: Turunkan rahang bawah 1 cm, tempelkan lidah lemas ke dasar mulut, buka bibir sedikit. Monolog cemas berhenti.",
          visualGuide: {
            headline: "Tongue Unclench 60s",
            palette: "Muted Slate & Sand",
            elements: "Instruksi fisik melemaskan pangkal lidah dan rahang",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja hipnoterapi Makassar: pasien insomnia parah yang tersiksa debat batin langsung hening begitu otot pangkal lidahnya dibimbing lemas total.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Slate Warm Minimal",
            elements: "Catatan keberhasilan penghentian dialog batin di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Hening malam ini tidak perlu dicari jauh-jauh, ia dimulai saat rahangmu berhenti tegang. Mau panduan PDF Hentikan Overthinking Subvocal? Balas story ini: RESET.",
          visualGuide: {
            headline: "Ruang Hening Alami",
            palette: "Night Deep Slate & Linen",
            elements: "Pesan penutup tenang dengan pemicu keyword RESET",
          },
        },
      ],
    },
    {
      topic: "Paradoks Impostor Syndrome: Kenapa Semakin Berhasil, Bawah Sadar Malah Makin Cemas?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Baru saja meraih pencapaian besar tapi batinmu malah gemetar menunggu kabar buruk?",
          visualGuide: {
            headline: "Paradoks Pencapaian",
            palette: "Dark Charcoal & Gold",
            elements: "Tipografi elegan menembus ketakutan saat sukses",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Bawah sadar memprogram zona aman masa lalu. Saat pencapaian melampaui baseline, otak mendeteksi ketinggian sebagai ancaman keterasingan.",
          visualGuide: {
            headline: "Upper Limit Problem",
            palette: "Dark Slate & Warm Sand",
            elements: "Highlight box batasan toleransi rasa aman bawah sadar",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Somatic Grounding 60 Detik: Tekan kedua telapak kaki kuat ke lantai, ambil dua tarikan napas pendek hidung, hembuskan tuntas lewat mulut.",
          visualGuide: {
            headline: "Somatic Grounding 60s",
            palette: "Charcoal & Sand",
            elements: "Manuver pijakan kaki dan physiological sigh untuk grounding",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Kasus profesional Makassar: selalu terserang dispepsia akut seminggu setelah promosi. Bawah sadarnya menganggap sukses adalah bahaya dihakimi orang lain.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Charcoal Warm",
            elements: "Kasus nyata psikosomatis pasca-pencapaian karir di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Kamu berhak berada di tempatmu sekarang tanpa harus terus membuktikan kelayakanmu. Mau panduan PDF Mengatasi Sabotase Diri Bawah Sadar? Balas story ini: RESET.",
          visualGuide: {
            headline: "Kamu Layak Berada di Sini",
            palette: "Night Slate & Warm Sand",
            elements: "Pesan penerimaan diri malam hari dengan keyword RESET",
          },
        },
      ],
    },
    {
      topic: "Toxic Positivity Internal: Kenapa Menolak Emosi Sedih Justru Mengunci Rasa Sakit di Badan?",
      keyword: "RESET",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Tersenyum pura-pura kuat saat batin terluka adalah racun paling cepat bagi sistem saraf.",
          visualGuide: {
            headline: "Racun Pura-pura Kuat",
            palette: "Dark Slate & Soft Rust",
            elements: "Refleksi mendalam bahaya penolakan luka batin",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Emosi adalah molekul fisik neuropeptida. Menolak merasakan sedih memaksa tubuh menyerap tegangan menjadi lambung perih dan migrain.",
          visualGuide: {
            headline: "Somatisasi Emosi Tertahan",
            palette: "Dark Slate & Muted Amber",
            elements: "Penjelasan jalur biokimia neuropeptida ke organ pencernaan",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Chest Hand Stillness 60 Detik: Taruh telapak kanan di tengah dada, kiri di ulu hati. Tarik napas pelan sambil bisikkan: 'Ini memang sedang berat'.",
          visualGuide: {
            headline: "Chest Hand Stillness",
            palette: "Slate Green & Linen",
            elements: "Instruksi peletakan tangan untuk menenangkan saraf vagus dada",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien wanita Makassar bertahun-tahun menelan emosinya demi keluarga. Saat diizinkan menangis 5 menit di ruang klinik, asam lambung kronisnya reda seketika.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Muted Deep Slate",
            elements: "Kisah pemulihan lambung saat emosi dilepaskan di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Menjadi manusia berarti boleh merasa lelah. Istirahatkan tuntutanmu malam ini. Mau panduan PDF Melepas Beban Emosi Terpendam? Balas story ini: RESET.",
          visualGuide: {
            headline: "Izin Menjadi Manusia",
            palette: "Night Deep Slate & Sand",
            elements: "Pesan hangat penutup malam dengan pemicu keyword RESET",
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
          text: "Selalu tidak enakan demi orang lain bukan sifat bawaan, melainkan refleks bertahan hidup.",
          visualGuide: {
            headline: "Bukan Kurang Percaya Diri",
            palette: "Dark Slate & Warm Gold",
            elements: "Tipografi kuat membuka tabir people-pleasing",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Saat kecil terbiasa ancaman penolakan, sistem saraf mengaktifkan respons Fawn: memprioritaskan ketenangan orang lain agar diri tetap aman.",
          visualGuide: {
            headline: "Fawn Response Purba",
            palette: "Dark Slate & Ice Linen",
            elements: "Highlight box teori polyvagal respon Fawn saat relasi terancam",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Throat & Jaw Release 60 Detik: Tarik dagu sedikit ke belakang, rilekskan tenggorokan, embuskan napas bersuara lembut 'ahhh' untuk melepas kuncian bicara.",
          visualGuide: {
            headline: "Throat & Jaw Release",
            palette: "Slate & Sand",
            elements: "Manuver pelepasan saraf laringeal untuk melatih batasan diri",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Catatan meja terapi Makassar: rasa bersalah saat menolak ajakan hilang bukan lewat motivasi percaya diri, melainkan saat saraf merasa aman dari penolakan.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Slate Muted",
            elements: "Kutipan klinis keberhasilan menegakkan batasan diri tanpa rasa bersalah",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Batasan dirimu adalah bentuk perlindungan, bukan kejahatan. Beri dirimu ruang bernapas malam ini. Mau panduan PDF Sembuhkan Refleks People Pleasing? Balas story ini: RESET.",
          visualGuide: {
            headline: "Batasan Adalah Perlindungan",
            palette: "Night Slate & Warm Linen",
            elements: "Pesan hangat penutup malam dengan pemicu keyword RESET",
          },
        },
      ],
    },
  ],

  TEKNOLOGI: [
    {
      topic: "Bawah Sadar Itu Pre-trained Weights: Kenapa Motivasi Gagal Mereset Otak?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Menghentikan overthinking dengan motivasi sama sia-sianya seperti mengubah model AI hanya lewat prompt sekilas.",
          visualGuide: {
            headline: "Bukan Kurang Motivasi",
            palette: "Deep Slate & Soft Blue",
            elements: "Desain kartu clean, analogi arsitektur model AI cerdas",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Bawah sadar persis pre-trained weights model AI. Mengubahnya butuh fine-tuning konsisten, bukan sekadar mengganti prompt di permukaan.",
          visualGuide: {
            headline: "Pre-trained Weights Batin",
            palette: "Dark Slate & Ice Blue",
            elements: "Analogi deep learning memori bawah sadar",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Physiological Sigh 60 Detik: Ambil dua tarikan napas pendek cepat lewat hidung, lalu hembuskan panjang lewat mulut. Alveoli paru mekar seketika.",
          visualGuide: {
            headline: "Physiological Sigh",
            palette: "Slate Clean & Sand",
            elements: "Langkah 2 tarikan pendek dan 1 hembusan panjang lega",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Sebagai solo dev AI sekaligus praktisi Makassar, WITA (UTC+8): ketakutan berulang di kepala sebenarnya adalah subvocal rumination—gerakan mikro pita suara tanpa suara. Saat lidah rileks menempel di langit-langit, overthinking berhenti otomatis.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Slate hangat",
            elements: "Wawasan persilangan neurosains dan komputasi dari Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Otakmu tidak rusak, dia hanya butuh shutdown rapi dari background process yang menumpuk. Mau panduan PDF Fine-Tuning Bawah Sadar & Hentikan Overthinking? Balas story ini: FOKUS.",
          visualGuide: {
            headline: "Shutdown Bersih Malam Ini",
            palette: "Dark Night & Warm White",
            elements: "Pesan hangat penutup hari dengan pemicu keyword FOKUS",
          },
        },
      ],
    },
    {
      topic: "Brain Background Process: Kenapa Otak Hang Bukan Karena Bodoh, Tapi Kebanyakan Tab Terbuka?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Kepalamu buntu dan lambat memproses hal sepele bukan karena lelah, tapi memori kerjamu meluap.",
          visualGuide: {
            headline: "Memori Kerja Meluap",
            palette: "Deep Charcoal & Cyan",
            elements: "Metafora visual komputasi sistem operasi otak manusia",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Setiap tugas tertunda adalah background process di latar otak yang terus menyedot glukosa dan RAM kognitif tanpa disadari.",
          visualGuide: {
            headline: "Zombie Background Process",
            palette: "Dark Charcoal & Soft Ice",
            elements: "Highlight box pengurasan energi kognitif oleh tugas mengambang",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Mental Task Dump 60 Detik: Tuliskan 3 hal yang paling mengganjal kepala di secarik kertas tanpa diedit, lalu tutup buku rapat-rapat.",
          visualGuide: {
            headline: "Mental Task Dump 60s",
            palette: "Slate & Sand",
            elements: "Langkah memindahkan beban RAM otak ke media fisik eksternal",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Programmer Makassar datang dengan keluhan brain fog parah: setelah background tasks mentalnya dimatikan secara fisik, kecepatan fokusnya pulih 3x lipat.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Slate Muted",
            elements: "Studi kasus pemulihan kejernihan berpikir developer di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Tutup semua jendela aplikasi di kepalamu malam ini. Esok hari ada energi baru menanti. Mau panduan PDF Membersihkan Cache Mental Bawah Sadar? Balas story ini: FOKUS.",
          visualGuide: {
            headline: "Bersihkan Cache Malam Ini",
            palette: "Night Deep Slate & Soft Cyan",
            elements: "Pesan penutup malam tenang dengan pemicu keyword FOKUS",
          },
        },
      ],
    },
    {
      topic: "Overfitting Pikiran: Kenapa Otak Selalu Mengulang Trauma Masa Lalu ke Kejadian Hari Ini?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Satu kegagalan masa lalu membuatmu takut mencoba hari ini? Otakmu sedang mengalami overfitting.",
          visualGuide: {
            headline: "Overfitting Batin",
            palette: "Deep Slate & Amber",
            elements: "Konsep machine learning diterapkan pada pola trauma otak",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Dalam machine learning, model overfitting menghafal masa lalu dan gagal mengenali konteks baru yang sebenarnya jauh lebih aman.",
          visualGuide: {
            headline: "Terjebak Pola Lama",
            palette: "Dark Slate & Warm Gold",
            elements: "Grafik komparasi generalisasi adaptif vs kaku masa lalu",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Context Switch Somatik 60 Detik: Sentuh 3 benda nyata di sekitarmu, sebut warnanya, lirikkan mata ke kanan 30 detik untuk mereset fokus saat ini.",
          visualGuide: {
            headline: "Context Switch Somatik",
            palette: "Slate Charcoal & Sand",
            elements: "Latihan grounding sensorik untuk menyadarkan otak pada masa kini",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di Makassar: klien yang takut bicara di depan umum karena dipermalukan saat sekolah lepas dari trauma begitu sarafnya sadar situasi hari ini sudah beda konteks.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Charcoal Warm",
            elements: "Catatan kesuksesan update model mental di meja terapi Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Hari ini bukan masa lalumu. Biarkan model batinmu belajar data baru yang penuh harapan. Mau panduan PDF Menghentikan Overfitting Bawah Sadar? Balas story ini: FOKUS.",
          visualGuide: {
            headline: "Data Baru yang Penuh Harapan",
            palette: "Night Slate & Warm Linen",
            elements: "Pesan hangat optimisme malam dengan pemicu keyword FOKUS",
          },
        },
      ],
    },
    {
      topic: "Dopamine Baseline Depletion: Kenapa Scroll HP Bikin Lelah Mental Lebih Parah dari Kerja Fisik?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Rebahan seharian scroll video pendek tapi badan malah lemas tak berdaya?",
          visualGuide: {
            headline: "Lelah Tanpa Gerak",
            palette: "Deep Charcoal & Soft Blue",
            elements: "Tipografi tajam membongkar ilusi istirahat lewat layar HP",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Setiap swipe memicu lonjakan dopamin buatan. Begitu lonjakan berakhir, otak membanting baseline dopamin ke titik nadir terendah.",
          visualGuide: {
            headline: "Dopamine Crash",
            palette: "Dark Charcoal & Cold Cyan",
            elements: "Kurva osilasi dopamin: lonjakan buatan disusul penurunan drastis",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Screen Fast Reset 60 Detik: Balikkan layar ponsel ke bawah, pandang titik terjauh di luar jendela selama 60 detik tanpa berkedip tergesa-gesa.",
          visualGuide: {
            headline: "Screen Fast Reset 60s",
            palette: "Slate & Linen",
            elements: "Panduan relaksasi pupil mata dan pemulihan baseline dopamin",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Di meja terapi Makassar, pecandu screen-time yang merasa depresi pulih energinya hanya dengan menaikkan kembali baseline dopamin lewat jeda visual.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Slate Muted",
            elements: "Hasil nyata pemulihan neurotransmiter di ruang konsultasi Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Pulihkan ketenangan alamimu malam ini jauh dari radiasi notifikasi. Mau panduan PDF Reset Reseptor Dopamin Otak? Balas story ini: FOKUS.",
          visualGuide: {
            headline: "Ketenangan Alami Malam Hari",
            palette: "Night Deep Charcoal & Sand",
            elements: "Pesan tenang penutup hari dengan pemicu keyword FOKUS",
          },
        },
      ],
    },
    {
      topic: "Predictive Coding Anomaly: Kenapa Bawah Sadar Meramalkan Skenario Buruk yang 99% Tak Pernah Terjadi?",
      keyword: "FOKUS",
      stories: [
        {
          slide: 1,
          time: "07:00",
          act: "HOOK",
          text: "Otak manusia bukan perekam realitas, melainkan mesin peramal bahaya yang sering berhalusinasi.",
          visualGuide: {
            headline: "Mesin Peramal Batin",
            palette: "Dark Slate & Soft Cyan",
            elements: "Konsep neurosains prediktif dan anomali sinyal bahaya",
          },
        },
        {
          slide: 2,
          time: "07:45",
          act: "EDUKASI",
          text: "Otak purba bertahan hidup dengan memprediksi skenario terburuk agar waspada. Sebagian besar ketakutanmu hanya halusinasi algoritma prediktif.",
          visualGuide: {
            headline: "Hallucination of Threat",
            palette: "Dark Slate & Warm Sand",
            elements: "Highlight box perbedaan bahaya fisik nyata vs prediksi fiktif otak",
          },
        },
        {
          slide: 3,
          time: "13:00",
          act: "PRAKTIK",
          text: "Reality Alignment 60 Detik: Ambil dua napas pendek (Physiological Sigh), lalu tanyakan tubuh: 'Apakah saat detik ini aku dalam bahaya fisik nyata?'",
          visualGuide: {
            headline: "Reality Alignment 60s",
            palette: "Slate Clean & Sand",
            elements: "Manuver kalibrasi kenyataan saat pikiran meramalkan skenario buruk",
          },
        },
        {
          slide: 4,
          time: "20:00",
          act: "BUKTI",
          text: "Klien psikosomatis Makassar gemetar tiap membaca berita duka. Begitu mekanisme predictive processing diurai, serangan paniknya berhenti seketika.",
          visualGuide: {
            headline: "Catatan Meja Terapi Makassar",
            palette: "Deep Slate Muted",
            elements: "Catatan empiris penghentian serangan panik prediktif di Makassar",
          },
        },
        {
          slide: 5,
          time: "21:00",
          act: "CTA HALUS",
          text: "Pikiranmu meramal badai, tapi kamarmu saat ini aman dan teduh. Istirahatlah dengan damai. Mau panduan PDF Kalibrasi Peramal Batin Otak? Balas story ini: FOKUS.",
          visualGuide: {
            headline: "Kamarmu Aman dan Teduh",
            palette: "Night Deep Slate & Soft Sand",
            elements: "Pesan damai penuh kepastian malam hari dengan keyword FOKUS",
          },
        },
      ],
    },
  ],
};

// Aliaskan CURATED_STORIES default ke variasi pertama per pilar untuk kompatibilitas ke belakang
const CURATED_STORIES = {
  TUBUH: CURATED_VARIATIONS.TUBUH[0],
  PIKIRAN: CURATED_VARIATIONS.PIKIRAN[0],
  TEKNOLOGI: CURATED_VARIATIONS.TEKNOLOGI[0],
};

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
 * Menentukan pilar harian secara otomatis
 */
function resolvePillar(requestedPillar, date = new Date()) {
  if (requestedPillar && PILLARS[requestedPillar.toUpperCase()]) {
    return requestedPillar.toUpperCase();
  }
  const day = date.getDay();
  if (day === 0 || day === 3) return "PIKIRAN";
  if (day === 1 || day === 4) return "TUBUH";
  return "TEKNOLOGI";
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
 * System prompt V2.3 — Paradoxical Insight & Anti-Generic Knowledge (Makassar)
 */
function buildSystemPrompt(pillarKey) {
  const pilar = PILLARS[pillarKey];
  return `Anda adalah ${BRAND_IDENTITY.creator}, pendiri brand ${BRAND_IDENTITY.brand} di Makassar, WITA (UTC+8).
Persona: ${BRAND_IDENTITY.persona}
Target Audiens: ${BRAND_IDENTITY.audience}
Gaya Bahasa: ${BRAND_IDENTITY.tone}

════════════════════════════════════════════════════════════════════════════════
4 PILAR MUTLAK PROMPT ENGINE V2.3 (PARADOXICAL INSIGHT & ANTI-GENERIC KNOWLEDGE)
════════════════════════════════════════════════════════════════════════════════

PILAR 1: DAFTAR LARANGAN KERAS (NEGATIVE CONSTRAINTS / BLACKLIST KLISE)
DILARANG KERAS menghasilkan solusi klise murahan berikut:
1. JANGAN sarankan "Tarik napas dalam-dalam" atau "Latihan napas 4-7-8 biasa" (terlalu pasaran dan tidak bekerja saat panik akut).
2. JANGAN sarankan "Hindari makanan pedas, asam, atau kopi" (itu ranah dokter umum/gizi biasa, bukan akar psikosomatis sistem saraf).
3. JANGAN gunakan frasa "Berpikir positif", "Jangan stres", atau "Tenangkan pikiran" (tidak berguna bagi orang yang sistem sarafnya sedang freeze atau terjebak alarm bahaya).
4. JANGAN sarankan "Coba luangkan waktu me-time atau relaksasi" (terlalu generik dan tidak solutif).

PILAR 2: CORE THEME: THE PARADOXICAL TRUTH (WAJIB MENGANGKAT CARA KERJA TERBALIK TUBUH & PIKIRAN)
Setiap naskah WAJIB mengangkat anomali biologis/psikologis nyata yang membalikkan asumsi awam:
- Jika Pilar TUBUH (Gut-Brain & Sistem Saraf):
  * Asam lambung naik saat panik sering kali BUKAN karena kelebihan asam, melainkan lambung kekurangan asam akibat saraf simpatik aktif, sehingga klep esofagus gagal mengunci rapat.
  * Relaxation-Induced Anxiety: Saat hari libur atau santai tubuh justru lemas, lambung perih, atau migrain (karena otak terbiasa siaga tinggi dan menganggap keheningan sebagai "ancaman sebelum badai").
  * Sleep Effort Paradox: Semakin dipaksa tidur cepat, mata justru semakin terjaga segar (otak mendeteksi usaha sadar untuk tidur sebagai tanda darurat bahaya).
- Jika Pilar PIKIRAN (Subconscious & Belief System):
  * Kenapa afirmasi positif gagal total: Saat bawah sadar merasa tidak aman, kata-kata manis justru terbaca sebagai ancaman penipuan (error mismatch) yang melipatgandakan kecemasan.
  * Subvocal Rumination: Suara batin yang mendikte ketakutan dan overthinking sebenarnya menggerakkan pita suara dan lidah secara mikro tanpa kita sadari.
- Jika Pilar TEKNOLOGI (AI Analogy):
  * Bawah sadar seperti pre-trained weights model AI yang dilatih ribuan jam sejak masa kecil. Mengubahnya butuh fine-tuning somatik konsisten, bukan sekadar mengganti prompt di permukaan.

PILAR 3: TEKNIK SOMATIK MIKRO 60 DETIK (STORY 3 - ANTI-MAINSTREAM)
Hanya berikan salah satu manuver fisik mikro anatomis nyata yang langsung dirasakan efeknya:
- Physiological Sigh: Dua tarikan napas pendek cepat lewat hidung, dihembuskan satu tarikan panjang perlahan lewat mulut (mereset alveoli paru-paru dan melambatkan detak jantung dalam 30 detik).
- Sub-occipital Lateral Eye Reset: Melirikkan bola mata ke sudut kanan tanpa menolehkan kepala selama 30 detik sampai ada reflek menguap atau menelan (mereset kuncian saraf leher belakang dan alarm bahaya).
- Jaw Release / Trigeminal Unclench: Merenggangkan rahang sedikit lalu membuka mulut santai sambil menempelkan ujung lidah ke langit-langit mulut (memutus sinyal darurat lambung dan menghentikan suara overthinking di kepala).

PILAR 4: STRUKTUR FORMAT KETAT 5 STORY (9:16 VERTICAL FORMAT)
- Story 1 (07:00 WITA) - HOOK: Pertanyaan / bantahan mitos yang menembus asumsi umum. MAKSIMAL 15 KATA (STRICT).
- Story 2 (07:45 WITA) - EDUKASI: Mekanisme paradoks + analogi sistem komputer/AI. MAKSIMAL 25 KATA (STRICT).
- Story 3 (13:00 WITA) - PRAKTIK: Manuver fisik mikro 60 detik (hanya Physiological Sigh, Lateral Eye Reset, atau Jaw/Trigeminal Release).
- Story 4 (20:00 WITA) - BUKTI: Kasus meja terapi Makassar / data riil anomali tubuh yang membuktikan kebenaran paradoks tersebut.
- Story 5 (21:00 WITA) - CTA HALUS: Refleksi malam hangat + ajakan ketik kata kunci (${pilar.defaultKeyword}) untuk mendapatkan link panduan PDF.

FORMAT KELUARAN WAJIB HANYA JSON VALID:
{
  "topic": "Judul Naskah Paradoks Hari Ini",
  "keyword": "${pilar.defaultKeyword}",
  "stories": [
    {
      "slide": 1,
      "time": "07:00",
      "act": "HOOK",
      "text": "Teks naskah hook membongkar mitos maksimal 15 kata",
      "visualGuide": {
        "headline": "Judul Singkat Menusuk",
        "palette": "Dark Slate & Warm Sand",
        "elements": "Desain minimalis 9:16 tenang dan elegan"
      }
    },
    {
      "slide": 2,
      "time": "07:45",
      "act": "EDUKASI",
      "text": "Teks edukasi paradoks + analogi sistem AI maksimal 25 kata",
      "visualGuide": {
        "headline": "Judul Konsep Paradoks",
        "palette": "Dark Slate & Warm Gold",
        "elements": "Highlight box konsep paradoks"
      }
    },
    {
      "slide": 3,
      "time": "13:00",
      "act": "PRAKTIK",
      "text": "Panduan manuver somatik mikro 60 detik nyata",
      "visualGuide": {
        "headline": "Nama Manuver 60 Detik",
        "palette": "Forest Sage & Sand",
        "elements": "Instruksi fisik anatomis mikro"
      }
    },
    {
      "slide": 4,
      "time": "20:00",
      "act": "BUKTI",
      "text": "Kisah meja terapi Makassar membuktikan anomali paradoks",
      "visualGuide": {
        "headline": "Catatan Meja Terapi Makassar",
        "palette": "Muted Slate hangat",
        "elements": "Format kutipan reflektif dari meja terapi Makassar"
      }
    },
    {
      "slide": 5,
      "time": "21:00",
      "act": "CTA HALUS",
      "text": "Pesan malam hangat dan ajakan balas ketik ${pilar.defaultKeyword}",
      "visualGuide": {
        "headline": "Judul Refleksi Malam",
        "palette": "Deep Night Slate & Soft Sand",
        "elements": "Ajakan santai penutup malam"
      }
    }
  ]
}`;
}

/**
 * Generate 5 Story V2.3
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
    let userPrompt = `Buatkan 5 babak Story WhatsApp Dokter Pikiran V2.3 untuk hari ini tanggal ${dateStr} WITA dengan pilar ${pillarKey}.
Lokasi Resmi: Makassar, WITA (UTC+8).
Seed Acak Kebaruan: ${entropySeed}-${Date.now()} (Wajib topik segar, unik, dan tidak mengulang topik kemarin).
WAJIB patuhi 4 Pilar Aturan V2.3:
1. Blacklist Klise: Dilarang napas 4-7-8 biasa, dilarang pantang makanan pedas/kopi, dilarang berpikir positif/jangan stres, dilarang me-time.
2. Paradoxical Truth: Wajib angkat mekanisme cara kerja terbalik/anomali tubuh atau pikiran yang mengejutkan.
3. Somatik Mikro 60 Detik: Praktik wajib salah satu dari Physiological Sigh, Sub-occipital Eye Reset, atau Trigeminal Jaw Release.
4. Format Ketat: Hook max 15 kata, Edukasi max 25 kata, Bukti catatan meja terapi Makassar, CTA Halus ketik ${pilar.defaultKeyword}.`;

    if (userTopic) {
      userPrompt += `\n\nFOKUS TOPIK / CATATAN KHUSUS DARI USER:\n"${userTopic}"\nBuat 5 babak naskah yang berfokus mendalam pada topik ini sesuai standar paradoks & anti-klise V2.3 Makassar.`;
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
            return result;
          }
        }
      } catch (err) {
        console.warn(`[StoryEngineV2] Model ${model} gagal:`, err.message || err);
      }
    }
  }

  // Fallback Kurasi Dinamis Berkualitas Tinggi V2.3 (5 Variasi Topik Paradoks Berputar Per Hari & Seed)
  const curated = getCuratedStoryForDate(
    pillarKey,
    targetDate,
    options.seed || (options.fresh ? Math.floor(Math.random() * 100) : null)
  );

  const fallbackStories = curated.stories.map((s, idx) => {
    if (userTopic && idx === 0) {
      return {
        ...s,
        text: `Tentang ${userTopic}: kamu tidak malas, alarm tubuhmu sedang siaga penuh.`,
        visualGuide: {
          ...s.visualGuide,
          headline: userTopic.length > 25 ? userTopic.slice(0, 25) + "..." : userTopic,
        },
      };
    }
    return s;
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
    keyword: curated.keyword,
    source: "curated_fallback",
    model: "DokterPikiran-Curated-V2.3-Makassar",
    stories: sanitizedFallback,
  };
  cacheLatestStory(result);
  return result;
}

module.exports = {
  BRAND_IDENTITY,
  PILLARS,
  CURATED_STORIES,
  CURATED_VARIATIONS,
  getCuratedStoryForDate,
  resolvePillar,
  enforceStoryWordLimits,
  generateStoryV2,
  cacheLatestStory,
};
