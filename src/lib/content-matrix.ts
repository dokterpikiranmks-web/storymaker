/**
 * src/lib/content-matrix.ts
 * Multi-Pillar Content Matrix for Dokter Pikiran Makassar.
 *
 * Ensures 5 daily slots are completely non-repetitive, covering:
 * - 07:00: Islamic Spiritual Mindset & Reality (Rezeki, Tawakkal, Takdir, Sabar)
 * - 10:00: Functional & Holistic Medicine (Gut-Brain, Science-backed Herbs, Acupressure, Nutrition, Qi Gong)
 * - 12:00: Mental Health, Hypno & Neuroscience (Mental block, Insecurity, Trauma, Parenting, Relationships, Ruang Pulih)
 * - 19:00: Practical Self-Therapy (Step-by-step somatic & emotional release)
 * - 21:00: Night Inspiration (Deep introspection, gentle slap of truth, subconscious sleep visualization)
 */

import type { StoryDraft, SlotTime, DailyEdition } from "./types";

export const WEEKLY_CONTENT_MATRIX: Record<number, Record<SlotTime, StoryDraft>> = {
  // 1 = SENIN
  1: {
    "07:00": {
      id: "mon-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 1,
      theme: "Psikologi Rezeki & Tawakkal",
      tag: "MOTIVASI PAGI",
      title: "Rezeki Anda Sudah Tertakar, Jangan Habiskan Energi Mencemaskannya",
      quoteMark: true,
      body: [
        "Tidak ada satu helai daun pun yang gugur tanpa izin Allah, apalagi urusan jalan rezeki Anda hari ini.",
        "Sering kali, yang membuat kita lelah bukanlah beban pekerjaan, melainkan ketakutan kita sendiri yang selalu ingin mengatur hal-hal di luar kendali kita.",
        "Tunaikan ikhtiar terbaik dengan niat ibadah, lalu serahkan hasilnya. Hati yang bertawakkal tidak akan pernah kehabisan ketenangan.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Morning Mindset",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
      illustrationPrompt: "A serene dawn landscape with golden rays streaming over mist, minimal silhouette in peaceful contemplation",
    },
    "10:00": {
      id: "mon-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 1,
      theme: "Gut-Brain Connection & Asam Lambung",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Saat Pikiran Buntu, Kenapa Perut yang Terasa Perih?",
      quoteMark: false,
      body: [
        "Banyak orang mengira asam lambung yang naik murni karena telat makan.",
        "Padahal, usus Anda terhubung langsung dengan otak melalui jutaan sel saraf. Ketika Anda memendam cemas atau amarah, tubuh seketika membaca itu sebagai sinyal bahaya.",
        "Akibatnya, pencernaan terkunci dan produksi asam lambung meningkat drastis.",
      ],
      highlightBox: {
        label: "CATATAN PRAKTISI",
        content: "Mengobati lambung tanpa merapikan pikiran sering kali hanya menjadi solusi sementara. Dengarkan tubuh Anda, karena tubuh tidak pernah berbohong.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Akar Masalah, Bukan Sekadar Plester",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
      illustrationPrompt: "Minimalist medical editorial illustration of the neural connection between brain and stomach, glowing golden neural thread on dark background",
    },
    "12:00": {
      id: "mon-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 1,
      theme: "Mental Block & Sabotase Diri",
      tag: "NEUROSAINS & MENTAL",
      title: "Mengapa Kita Kerap Menyabotase Peluang Emas Sendiri?",
      quoteMark: false,
      body: [
        "Pernahkah Anda mendapatkan kesempatan besar, namun tiba-tiba merasa cemas berlebihan dan menunda mengerjakannya sampai terlewat?",
        "Neurosains menyebut ini sebagai *impostor anxiety*. Bawah sadar Anda mengasosiasikan kesuksesan dengan bahaya penolakan atau tanggung jawab yang menakutkan.",
        "Logika Anda ingin melangkah maju, namun sistem pertahanan emosi Anda menarik rem darurat.",
      ],
      highlightBox: {
        label: "INSIGHT BAWAH SADAR",
        content: "Anda tidak sedang malas. Anda hanya sedang melindungi diri dari ketakutan lama yang belum terselesaikan.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Mental Growth",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "19:00": {
      id: "mon-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 1,
      theme: "Pelepasan Ketegangan Fisik 90 Detik",
      tag: "PANDUAN SELF-TERAPI",
      title: "Latihan Sederhana 90 Detik: Melepaskan Beban Hari Ini",
      quoteMark: false,
      body: [],
      steps: [
        { num: "1", text: "Tarik napas lewat hidung 4 detik, lalu hembuskan lewat mulut perlahan selama 6 detik dengan desahan halus." },
        { num: "2", text: "Sadari pundak dan rahang gigi Anda. Turunkan pundak yang kaku dan lepaskan gigitan rahang bawah." },
        { num: "3", text: "Katakan dalam hati: 'Tugas hari ini telah selesai. Yang belum tuntas, cukup menjadi urusan esok hari.'" },
      ],
      highlightBox: {
        label: "RESPON SISTEM SARAF",
        content: "Hembusan napas yang panjang adalah sinyal resmi bagi sistem saraf otonom bahwa kondisi saat ini sudah aman untuk istirahat.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Somatic & Nervous System Reset",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "mon-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 1,
      theme: "Izin untuk Beristirahat",
      tag: "INSPIRASI MALAM",
      title: "Izin untuk Beristirahat",
      quoteMark: true,
      body: [
        "Tempat tidur Anda adalah ruang untuk memulihkan diri, bukan ruang pengadilan untuk menghakimi kekurangan Anda sepanjang hari.",
        "Maafkan hal-hal yang tidak berjalan sesuai rencana hari ini. Tutup mata Anda, biarkan tubuh dan pikiran Anda terlelap dalam rasa cukup.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Evening Reflection",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
      illustrationPrompt: "Dark cozy bedroom silhouette with moonlit window, deep blue and velvet tones, restful stillness",
    },
  },

  // 2 = SELASA (PROMO RUANG PULIH AKTIF DI 12:00)
  2: {
    "07:00": {
      id: "tue-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 2,
      theme: "Penerimaan Ujian & Hikmah Takdir",
      tag: "MOTIVASI PAGI",
      title: "Ketika Rencana Berantakan, Allah Sedang Menyelamatkan Anda",
      quoteMark: true,
      body: [
        "Boleh jadi Anda membenci sesuatu padahal ia amat baik bagi Anda, dan boleh jadi Anda menyukai sesuatu padahal ia amat buruk bagi Anda.",
        "Jangan terburu-buru mengeluh saat urusan Anda tertunda hari ini. Terkadang Allah menutup satu pintu bukan karena tidak mendengar doa Anda, melainkan untuk menjaga Anda dari jurang yang tidak Anda lihat.",
        "Tenangkan hati. Ketetapan Allah selalu lebih bijaksana daripada keinginan kita.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Tauhid & Ketenangan",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "tue-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 2,
      theme: "Sarapan Gula & Brain Fog Jam 10",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Mengapa Otak Sulit Fokus dan Cemas di Jam 10 Pagi?",
      quoteMark: false,
      body: [
        "Banyak orang mengira rasa lemas dan cemas di tengah jam kerja murni karena kurang tidur.",
        "Secara fungsional, sarapan tinggi karbohidrat olahan memicu lonjakan glukosa cepat yang disusul *glucose crash*. Saat gula darah anjlok, otak membaca kondisi ini sebagai ancaman darurat dan memompa hormon adrenalin.",
        "Akibatnya, jantung berdebar dan pikiran mendadak gelisah tanpa sebab.",
      ],
      highlightBox: {
        label: "SOLUSI PRAKTIS BERBASIS SAINS",
        content: "Awali pagi dengan protein dan lemak sehat. Bila cemas datang, pijat titik akupresur Neiguan di pergelangan tangan bagian dalam selama 60 detik untuk menenangkan detak jantung.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Nutrisi & Saraf Fungsional",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "12:00": {
      id: "tue-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 2,
      theme: "Parenting & Transfer Luka Inner Child",
      tag: "NEUROSAINS & RUANG PULIH",
      title: "Mengapa Kita Membentak Anak, Padahal Sangat Menyayanginya?",
      quoteMark: false,
      body: [
        "Sering kali, suara keras yang keluar saat anak berbuat salah bukanlah respon logis Anda sebagai orang dewasa.",
        "Neurosains membuktikan bahwa tangisan atau bantahan anak memicu *alarm memori* di amigdala Anda—mengingatkan bawah sadar Anda pada masa kecil ketika emosi Anda sendiri tidak pernah divalidasi oleh orang tua.",
        "Anda tidak sedang marah pada anak Anda. Anda sedang merespon luka lama Anda sendiri yang belum pulih.",
      ],
      highlightBox: {
        label: "RUANG PULIH DOKTER PIKIRAN",
        content: "Menghentikan transfer luka ke generasi berikutnya membutuhkan keberanian untuk mengurai akarnya. Di Ruang Pulih Dokter Pikiran, kami mendampingi Anda memulihkan luka batin tersebut secara privat, aman, dan tanpa penghakiman.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Layanan Terapi Ruang Pulih",
      isRuangPulihPromo: true, // PROMOTIONAL DAY (SELASA)
      visualModePreferred: "illustrated",
    },
    "19:00": {
      id: "tue-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 2,
      theme: "Teknik Rilis Kata-Kata Menyakitkan",
      tag: "PANDUAN SELF-TERAPI",
      title: "Teknik 2 Menit Menghapus Rekaman Kata Menyakitkan",
      quoteMark: false,
      body: [],
      steps: [
        { num: "1", text: "Duduk tegak, letakkan satu telapak tangan di tengah dada dan rasakan detak jantung Anda." },
        { num: "2", text: "Tarik napas 4 detik. Sambil memejamkan mata, bayangkan suara kritik orang lain itu mengecil volumenya, lalu perlahan menjauh dan lenyap." },
        { num: "3", text: "Hembuskan napas panjang lewat mulut 6 detik dan katakan: 'Pendapat orang lain adalah cerminan dirinya, bukan harga diri saya.'" },
      ],
      highlightBox: {
        label: "BIO-LOGIC",
        content: "Sentuhan tangan di dada menstimulasi pelepasan hormon oksitosin alami, memberi rasa aman instan pada otak bawah sadar Anda.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Somatic Emotional Release",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "tue-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 2,
      theme: "Tamparan Lembut: Validasi Fana",
      tag: "INSPIRASI MALAM",
      title: "Berhenti Mengorbankan Jiwa Demi Tepuk Tangan yang Fana",
      quoteMark: true,
      body: [
        "Berapa banyak energi hidup Anda hari ini yang habis hanya untuk membuktikan kepada orang lain bahwa Anda hebat, Anda sukses, atau Anda benar?",
        "Tubuh Anda lelah. Jiwa Anda haus akan ketenangan sejati.",
        "Malam ini, letakkan topeng Anda. Maafkan diri Anda yang terlalu keras memikul ekspektasi dunia. Tarik napas dalam-dalam, pasrahkan segalanya kepada Allah. Anda sudah cukup untuk hari ini.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Muhasabah Malam",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
  },

  // 3 = RABU
  3: {
    "07:00": {
      id: "wed-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 3,
      theme: "Kedamaian Rumah Kepala",
      tag: "MOTIVASI PAGI",
      title: "Ketenangan Bukan Berarti Tidak Ada Masalah",
      quoteMark: true,
      body: [
        "Ketenangan bukan berarti tidak ada masalah di sekitar Anda hari ini.",
        "Ketenangan adalah ketika Anda memilih untuk tidak membiarkan keributan di luar masuk dan merusak rumah di dalam kepala Anda.",
        "Tarik napas perlahan. Hari ini, jalani satu hal dalam satu waktu dengan penuh kesadaran.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Morning Mindset",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "wed-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 3,
      theme: "Amarah Terpendam & Inflamasi Liver",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Amarah yang Tertahan: Kaitan Emosi dengan Nyeri Leher",
      quoteMark: false,
      body: [
        "Dalam tinjauan fungsional, menelan amarah tanpa melepaskannya menahan otot trapezius dan rahang dalam keadaan kontraksi terus-menerus.",
        "Hati dan kelenjar adrenal dipaksa memproduksi senyawa pro-inflamasi secara berlebihan, memicu sakit kepala tegang (*tension headache*).",
        "Penyakit fisik sering kali merupakan teriakan dari emosi yang dipaksa bungkam.",
      ],
      highlightBox: {
        label: "HERBAL TERUJI",
        content: "Kurkumin dari temulawak terbukti secara klinis menurunkan biomarker inflamasi interleukin-6. Padukan dengan latihan pernapasan diafragma untuk merilis otot leher.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Somato-Visceral Health",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "12:00": {
      id: "wed-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 3,
      theme: "Insecurity & People Pleasing",
      tag: "NEUROSAINS & MENTAL",
      title: "Kelelahan Menjadi Orang yang Selalu Mengiyakan",
      quoteMark: false,
      body: [
        "Ketidakmampuan Anda berkata 'tidak' kepada orang lain sebenarnya berakar dari rasa takut ditolak (*rejection sensitivity*).",
        "Di masa lalu, bawah sadar Anda menyimpulkan bahwa untuk dicintai, Anda harus berguna dan mengorbankan diri sendiri.",
        "Setiap kali Anda mengatakan 'ya' pada orang lain padahal hati Anda ingin menolak, Anda sedang mengkhianati kedamaian batin Anda sendiri.",
      ],
      highlightBox: {
        label: "PRINSIP BATASAN DIRI",
        content: "Batasan diri yang sehat (*healthy boundaries*) bukan bentuk keegoisan, melainkan cara menjaga kewarasan agar Anda tetap bisa memberi dari cangkir yang penuh.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Self-Worth & Boundaries",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "19:00": {
      id: "wed-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 3,
      theme: "Grounding Somatik 5-4-3-2-1",
      tag: "PANDUAN SELF-TERAPI",
      title: "Latihan Grounding: Menarik Pikiran Kembali ke Saat Ini",
      quoteMark: false,
      body: [],
      steps: [
        { num: "5", text: "Sebutkan 5 benda di sekitar Anda yang dapat Anda lihat dengan jelas." },
        { num: "4", text: "Sentuh 4 permukaan di dekat Anda dan rasakan teksturnya (baju, meja, kulit)." },
        { num: "3", text: "Dengarkan 3 suara berbeda di sekitar ruangan Anda." },
      ],
      highlightBox: {
        label: "MEKANISME NEUROSAINS",
        content: "Latihan sensori ini memaksa korteks prefrontal mengambil alih kendali dari amigdala yang panik, menghentikan badai overthinking seketika.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Grounding Protocol",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "wed-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 3,
      theme: "Introspeksi: Menunda Hidup",
      tag: "INSPIRASI MALAM",
      title: "Kita Kerap Menunda Bahagia Demi Menunggu Segalanya Sempurna",
      quoteMark: true,
      body: [
        "Berapa banyak hari indah yang terlewat begitu saja karena Anda menunggu semua masalah selesai dulu baru merasa berhak untuk tersenyum?",
        "Masalah hidup tidak akan pernah habis sampai raga kita kembali ke tanah.",
        "Belajarlah menemukan kedamaian di tengah ketidaksempurnaan. Rebahkan tubuh Anda, bersyukurlah untuk napas hari ini, dan biarkan tidur Anda menjadi perhentian yang syahdu.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Evening Reflection",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
  },

  // 4 = KAMIS (PROMO RUANG PULIH AKTIF DI 12:00)
  4: {
    "07:00": {
      id: "thu-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 4,
      theme: "Memaafkan Manusia & Menjaga Hati",
      tag: "MOTIVASI PAGI",
      title: "Melepaskan Sakit Hati Adalah Hadiah untuk Diri Sendiri",
      quoteMark: true,
      body: [
        "Mendendam pada perlakuan buruk orang lain itu ibarat Anda meminum racun, namun berharap orang lain yang celaka.",
        "Orang yang melukai Anda mungkin sudah tidur nyenyak, sementara Anda menyiksa diri memikirkan kesalahan mereka.",
        "Serahkan keadilan kepada Allah Yang Maha Adil. Maafkan mereka bukan karena mereka pantas dimaafkan, melainkan karena jiwa Anda terlalu berharga untuk dipenjara oleh kebencian.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Tazkiyatun Nafs",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "thu-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 4,
      theme: "Magnesium Glycinate & Relaksasi Saraf",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Mineral yang Hilang: Mengapa Otot Anda Kerap Tegang dan Gelisah?",
      quoteMark: false,
      body: [
        "Stres kronis menguras cadangan magnesium intraseluler melalui urine secara masif.",
        "Ketika tubuh defisiensi magnesium, reseptor kalsium di serat otot terkunci dalam posisi kontraksi, dan reseptor NMDA di otak menjadi terlalu sensitif—memicu kedutan, gelisah, dan insomnia.",
        "Tubuh yang lelah membutuhkan nutrisi esensial untuk mematikan mode siaga.",
      ],
      highlightBox: {
        label: "REKOMENDASI NUTRISI KLINIS",
        content: "Magnesium bentuk glycinate memiliki bioavailabilitas tinggi dan berikatan dengan asam amino glisin yang menenangkan otak. Konsumsi sayuran hijau gelap, biji labu, atau suplemen terstandar.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Mineral & Cellular Health",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "12:00": {
      id: "thu-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 4,
      theme: "Logika vs Rekaman Bawah Sadar",
      tag: "NEUROSAINS & RUANG PULIH",
      title: "Mengapa Logika Kita Sering Kalah Telak dari Rasa Cemas?",
      quoteMark: false,
      body: [
        "Otak logis Anda mungkin berkata: 'Ini masalah sepele, tidak perlu dicemaskan.' Namun dada tetap terasa sesak dan jantung berdegup kencang.",
        "Mengapa? Karena logika hanya mengendalikan 5% dari respon kita. Sisanya, 95% reaksi tubuh dipandu oleh rekaman memori bawah sadar yang belum tuntas diurai sejak masa lalu.",
        "Rasa takut lama yang tersimpan di sistem limbik selalu lebih cepat menggerakkan tubuh daripada pemikiran rasional.",
      ],
      highlightBox: {
        label: "RUANG PULIH DOKTER PIKIRAN",
        content: "Mengurai simpul bawah sadar yang tertahan bertahun-tahun tentu sulit dilakukan sendirian. Jika Anda merasa lelah berputar di lingkaran yang sama, Ruang Pulih hadir sebagai tempat aman untuk mengurai akarnya sampai tuntas tanpa dihakimi.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Layanan Terapi Ruang Pulih",
      isRuangPulihPromo: true, // PROMOTIONAL DAY (KAMIS)
      visualModePreferred: "illustrated",
    },
    "19:00": {
      id: "thu-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 4,
      theme: "Anchoring Hipnoterapi Percaya Diri",
      tag: "PANDUAN SELF-TERAPI",
      title: "Membangun Jangkar Ketenangan (Anchoring Hipnosis)",
      quoteMark: false,
      body: [],
      steps: [
        { num: "1", text: "Ingat kembali satu momen dalam hidup ketika Anda merasa sangat tenang, aman, dan percaya diri." },
        { num: "2", text: "Rasakan kembali sensasi hangat itu di dada Anda. Saat perasaan tersebut memuncak, jepit ibu jari dan jari telunjuk Anda bersamaan." },
        { num: "3", text: "Tarik napas dalam, lalu lepaskan. Lakukan 3 kali pengulangan untuk mengunci respon saraf ini." },
      ],
      highlightBox: {
        label: "EFEK HIPNOTERAPI",
        content: "Jepitan jari ini menjadi 'saklar fisik' yang memanggil kembali respon ketenangan saraf ketika Anda menghadapi situasi menegangkan esok hari.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Clinical Neuro-Conditioning",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "thu-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 4,
      theme: "Sugesti Pemulihan Seluler Saat Tidur",
      tag: "INSPIRASI MALAM",
      title: "Malam Ini, Biarkan Sel-Sel Tubuh Anda Menyembuhkan Dirinya",
      quoteMark: true,
      body: [
        "Saat Anda memejamkan mata dan tertidur lelap, otak Anda mulai membilas racun metabolik dan sistem imun Anda bekerja mereparasi jaringan yang lelah.",
        "Jangan bebani tubuh Anda dengan kecemasan hari esok yang belum tentu terjadi.",
        "Katakan pada raga Anda: 'Terima kasih telah bertahan hari ini.' Tidurlah dalam kepasrahan, karena esok hari adalah rahmat yang baru.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Sugesti Malam",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
  },

  // 5 = JUMAT
  5: {
    "07:00": {
      id: "fri-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 5,
      theme: "Shalat Fajar & Bio-Reset Ruhani",
      tag: "MOTIVASI PAGI",
      title: "Waktu Fajar: Pemrograman Ulang Jiwa Sebelum Menatap Dunia",
      quoteMark: true,
      body: [
        "Dua rakaat fajar lebih berharga dari dunia dan seisinya.",
        "Secara neurologis, waktu fajar adalah peralihan alami dari dominasi gelombang otak delta ke alfa. Pikiran berada dalam kondisi paling reseptif untuk ditanamkan rasa tawakkal dan syukur.",
        "Mulailah hari Jumat ini dengan sujud yang tenang. Letakkan kepala yang penuh beban di tempat terendah, agar Allah mengangkat derajat batin Anda.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Berkah Jumat",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "fri-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 5,
      theme: "Intermittent Fasting & Autophagy",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Kekuatan Jeda Makan: Bagaimana Puasa Meremajakan Sel Otak",
      quoteMark: false,
      body: [
        "Ketika lambung dan usus beristirahat dari proses mencerna selama 14–16 jam, tubuh beralih ke mode *autophagy*—mekanisme daur ulang sampah protein seluler.",
        "Puasa merangsang pelepasan BDNF (*Brain-Derived Neurotrophic Factor*), protein ajaib yang menumbuhkan koneksi sel otak baru dan mencegah penuaan dini.",
        "Sunnah puasa bukan sekadar ibadah spiritual, melainkan teknologi biologis tercanggih untuk detoksifikasi raga.",
      ],
      highlightBox: {
        label: "FAKTA SAINS",
        content: "Autophagy memulihkan sensitivitas insulin dan meredakan peradangan kronis di pembuluh darah otak secara signifikan.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Metabolic Medicine",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "12:00": {
      id: "fri-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 5,
      theme: "Burnout & Mati Rasa Emosional",
      tag: "NEUROSAINS & MENTAL",
      title: "Ketika Lelah Bukan Lagi Soal Fisik, Melainkan Jiwa yang Sunyi",
      quoteMark: false,
      body: [
        "Banyak profesional merasa mampu menyelesaikan semua target kerja, namun anehnya mereka kehilangan rasa bahagia (*anhedonia*).",
        "Ini adalah fase lanjut dari *burnout*: otak mematikan volume emosi Anda (*emotional numbness*) sebagai respon darurat agar Anda tidak hancur oleh kelelahan kronis.",
        "Tubuh Anda sedang menuntut jeda. Anda tidak bisa terus mengisi cangkir orang lain saat cangkir Anda sendiri sudah retak.",
      ],
      highlightBox: {
        label: "LANGKAH PEMULIHAN",
        content: "Izinkan diri Anda melambat tanpa merasa bersalah. Istirahat bukanlah hadiah setelah selesai bekerja, melainkan kebutuhan biologis agar tetap berfungsi.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Burnout Recovery",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "19:00": {
      id: "fri-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 5,
      theme: "Pernapasan Vagal Box-Breathing",
      tag: "PANDUAN SELF-TERAPI",
      title: "Mengaktifkan Rem Alami Tubuh dengan Teknik Kotak (Box-Breathing)",
      quoteMark: false,
      body: [],
      steps: [
        { num: "4d", text: "Tarik napas perlahan lewat hidung selama 4 detik." },
        { num: "4d", text: "Tahan napas di rongga dada secara rileks selama 4 detik." },
        { num: "4d", text: "Hembuskan perlahan lewat mulut selama 4 detik, lalu tahan kosong 4 detik." },
      ],
      highlightBox: {
        label: "MANFAAT",
        content: "Latihan 4 siklus ini langsung menurunkan tekanan darah sistolik dan menormalkan kembali variabilitas detak jantung (HRV).",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Autonomic Reset",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "fri-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 5,
      theme: "Kepasrahan Total Fajar Mendatang",
      tag: "INSPIRASI MALAM",
      title: "Menyerahkan Seluruh Beban Kepada Yang Menggenggam Jiwa",
      quoteMark: true,
      body: [
        "Malam ini, sadarilah bahwa Anda hanyalah manusia biasa dengan daya yang sangat terbatas.",
        "Jangan memikul beban hari esok di atas pundak Anda malam ini. Yang mengurus alam semesta tidak pernah mengantuk apalagi tertidur.",
        "Lepaskan genggaman Anda pada ketakutan. Tidurlah dalam naungan kasih sayang Allah.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Tawakkal Malam",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
  },

  // 6 = SABTU (PROMO RUANG PULIH AKTIF DI 12:00)
  6: {
    "07:00": {
      id: "sat-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 6,
      theme: "Rasa Cukup & Anti-FOMO",
      tag: "MOTIVASI PAGI",
      title: "Kebahagiaan Bukan Memiliki Segalanya, Melainkan Merasa Cukup",
      quoteMark: true,
      body: [
        "Dunia ini dirancang untuk membuat Anda selalu merasa kurang jika Anda terus melihat apa yang dimiliki orang lain.",
        "Padahal, kekayaan sejati ada di dalam dada: kemampuan untuk mensyukuri secangkir kopi pagi, kesehatan badan, dan hati yang tenang tanpa rasa dengki.",
        "Katakan 'alhamdulillah' hari ini. Apa yang ada pada Anda saat ini adalah impian bagi jutaan orang lain.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Qana'ah Mindset",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "sat-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 6,
      theme: "Akupresur Titik Zusanli & Energi Vital",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Titik Panjang Umur: Mengapa Titik Zusanli Meredakan Kelelahan?",
      quoteMark: false,
      body: [
        "Dalam tradisi akupresur holistik yang telah diteliti oleh neurosains modern, titik Zusanli (ST36) yang berada empat jari di bawah tempurung lutut terhubung ke saraf peroneal dalam.",
        "Menekan titik ini selama 2 menit merangsang sirkulasi mikrovaskular lambung dan memicu pelepasan endorfin.",
        "Teknik sederhana ini mengembalikan vitalitas tubuh tanpa perlu mengandalkan kafein berlebih.",
      ],
      highlightBox: {
        label: "CARA APLIKASI",
        content: "Tekan perlahan dengan ibu jari membentuk gerakan melingkar sambil menarik napas dalam 10 kali di kedua kaki.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Holistic Bio-Mechanics",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "12:00": {
      id: "sat-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 6,
      theme: "Relationship & Attachment Style (Luka Relasi)",
      tag: "NEUROSAINS & RUANG PULIH",
      title: "Mengapa yang Satu Mengejar, yang Satu Malah Menghindar?",
      quoteMark: false,
      body: [
        "Dalam hubungan pernikahan atau asmara, konflik berulang sering kali bukan karena hilangnya rasa cinta, melainkan tabrakan gaya kelekatan (*attachment style*).",
        "Pribadi *anxious* panik saat pasangan diam dan terus mendesak penjelasan, sementara pribadi *avoidant* merasa tercekik dan memilih menarik diri.",
        "Keduanya sedang merespon rasa takut yang sama dengan cara yang bertolak belakang.",
      ],
      highlightBox: {
        label: "RUANG PULIH DOKTER PIKIRAN",
        content: "Menyembuhkan pola hubungan yang berulang membutuhkan pemahaman mendalam tentang luka masa lalu masing-masing. Di Ruang Pulih Dokter Pikiran, kami membantu Anda dan pasangan mengurai akar konflik dari bawah sadar dengan pendekatan yang aman dan solutif.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Layanan Terapi Ruang Pulih",
      isRuangPulihPromo: true, // PROMOTIONAL DAY (SABTU)
      visualModePreferred: "illustrated",
    },
    "19:00": {
      id: "sat-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 6,
      theme: "Somatic Shake & Pelepasan Fasia",
      tag: "PANDUAN SELF-TERAPI",
      title: "Somatic Shaking: Membuang Residu Stres dari Jaringan Tubuh",
      quoteMark: false,
      body: [],
      steps: [
        { num: "1", text: "Berdiri tegak dengan lutut sedikit ditekuk rileks di kamar Anda." },
        { num: "2", text: "Goyangkan perlahan kedua tangan, pundak, dan seluruh tubuh dengan ritme lembut selama 2 menit." },
        { num: "3", text: "Biarkan desahan napas keluar alami saat tubuh bergoyang. Berhenti, lalu rasakan sensasi hangat mengalir." },
      ],
      highlightBox: {
        label: "NEUROGENIC RELEASE",
        content: "Hewan di alam liar selalu mengguncang tubuhnya setelah lolos dari bahaya untuk membuang hormon stres. Tubuh manusia pun memiliki mekanisme bawaan yang sama.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Somatic Shake Protocol",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "sat-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 6,
      theme: "Memaafkan Diri yang Tidak Sempurna",
      tag: "INSPIRASI MALAM",
      title: "Anda Telah Berjuang Keras, Berterima Kasihlah pada Raga Anda",
      quoteMark: true,
      body: [
        "Jangan terus menuntut diri Anda menjadi manusia super tanpa cela.",
        "Raga ini telah menemani Anda melangkah melalui hari-hari berat yang tak pernah Anda ceritakan kepada siapa pun.",
        "Malam ini, ucapkan terima kasih kepada jantung yang setia berdetak dan kaki yang terus melangkah. Maafkan ketidaksempurnaan Anda, dan biarkan tidur memeluk Anda hangat.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Kasih Diri & Penutup Pekan",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
  },

  // 0 = MINGGU
  0: {
    "07:00": {
      id: "sun-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 0,
      theme: "Muhasabah Waktu & Integritas",
      tag: "MOTIVASI PAGI",
      title: "Hidup Terlalu Singkat untuk Dihabiskan dalam Kepura-puraan",
      quoteMark: true,
      body: [
        "Kita sering kali sibuk membangun citra di mata orang lain, hingga lupa merawat kenyataan batin kita sendiri.",
        "Matahari pagi Minggu ini mengingatkan kita bahwa jatah usia terus berkurang tanpa permisi.",
        "Hiduplah secara jujur dengan diri sendiri dan bertakwalah kepada Allah. Ketenangan sejati hanya datang ketika apa yang Anda pikirkan, katakan, dan perbuat berjalan selaras.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Refleksi Pekan",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
    "10:00": {
      id: "sun-1000",
      slot: "10:00",
      pillar: "KESEHATAN_FUNGSIONAL",
      dayOfWeek: 0,
      theme: "Olah Napas & Senam Chi Kung Peregangan Fasia",
      tag: "KESEHATAN FUNGSIONAL",
      title: "Senam Chi Kung Sederhana: Mengalirkan Darah ke Mikrosirkulasi",
      quoteMark: false,
      body: [
        "Duduk terlalu lama sepanjang pekan membuat jaringan ikat (*fascia*) mengeras dan menjepit pembuluh darah mikro.",
        "Gerakan peregangan Chi Kung yang lembut dan sinkron dengan tarikan napas mengembalikan elastisitas fasia dan menurunkan kadar asam laktat.",
        "Kesehatan fungsional mengajarkan bahwa gerakan adalah obat terbaik bagi tubuh yang stagnan.",
      ],
      highlightBox: {
        label: "PANDUAN MINGGU PAGI",
        content: "Lakukan peregangan membuka dada sambil menarik napas dalam 10 kali di bawah sinar matahari pagi untuk mengaktifkan sintesis vitamin D alami.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Movement Medicine",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "12:00": {
      id: "sun-1200",
      slot: "12:00",
      pillar: "MENTAL_NEUROSAINS",
      dayOfWeek: 0,
      theme: "Neuroplastisitas & Memutus Siklus Lama",
      tag: "NEUROSAINS & MENTAL",
      title: "Otak Anda Dapat Dipetakan Ulang: Putus Siklus Lama",
      quoteMark: false,
      body: [
        "Anda bukan korban permanen dari masa lalu Anda. Neurosains modern membuktikan adanya *neuroplastisitas*—kemampuan otak untuk membentuk jalur saraf baru sepanjang hayat.",
        "Setiap kali Anda menahan diri untuk tidak bereaksi marah seperti biasa, Anda sedang melemahkan sirkuit kebiasaan lama.",
        "Perubahan tidak butuh keajaiban instan, melainkan kesadaran kecil yang konsisten diulang setiap hari.",
      ],
      highlightBox: {
        label: "NEURO-HABIT",
        content: "Apa yang Anda fokuskan dan latih secara berulang akan menjadi struktur biologis otak Anda di masa depan.",
      },
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Neuroplastic Growth",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "19:00": {
      id: "sun-1900",
      slot: "19:00",
      pillar: "SELF_TERAPI",
      dayOfWeek: 0,
      theme: "Reframing Dialog Batin Sebelum Pekan Baru",
      tag: "PANDUAN SELF-TERAPI",
      title: "Menutup Percakapan Menghakimi Diri Sendiri",
      quoteMark: false,
      body: [],
      steps: [
        { num: "1", text: "Ambil secarik kertas, tuliskan 1 ketakutan terbesar Anda untuk pekan yang akan datang." },
        { num: "2", text: "Tanyakan pada diri: 'Apakah hal ini sudah pasti terjadi 100% atau hanya karangan ketakutan saya?'" },
        { num: "3", text: "Coret ketakutan tersebut dan tuliskan di sampingnya: 'Saya serahkan urusan ini pada pertolongan Allah.'" },
      ],
      highlightBox: {
        label: "KOGNITIF REFRAMING",
        content: "Menuliskan ketakutan memindahkan aktivitas dari pusat cemas (amigdala) ke pusat analisis otak, melucuti daya takutnya seketika.",
      },
      signature: "Dokter Pikiran Makassar",
      subSignature: "Ahmad Jawahir Zain · Cognitive Restructuring",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    },
    "21:00": {
      id: "sun-2100",
      slot: "21:00",
      pillar: "INSPIRASI_MALAM",
      dayOfWeek: 0,
      theme: "Ketenangan Batin Tanpa Syarat",
      tag: "INSPIRASI MALAM",
      title: "Tidurlah dalam Rasa Cukup, Esok Allah Masih Menjaga Anda",
      quoteMark: true,
      body: [
        "Pekan ini telah usai dengan segala dinamikanya. Tidak ada lagi yang perlu Anda khawatirkan malam ini.",
        "Tuhan yang mencukupi hidup Anda hari ini adalah Tuhan yang sama yang akan menjaga Anda esok pagi.",
        "Rebahkan kepala Anda dengan tenang, tutup mata Anda dengan rasa syukur, dan bangunlah esok dengan jiwa yang kembali suci.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar · Penutup Pekan",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    },
  },
};

/**
 * Resolves a day string, number, or current WITA day to day index (0 = Minggu ... 6 = Sabtu).
 */
export function parseDayIndex(dayInput?: string | number | null): number {
  if (typeof dayInput === "number" && dayInput >= 0 && dayInput <= 6) {
    return dayInput;
  }
  if (typeof dayInput === "string") {
    const s = dayInput.toLowerCase().trim();
    if (s === "minggu" || s === "sunday" || s === "sun" || s === "0") return 0;
    if (s === "senin" || s === "monday" || s === "mon" || s === "1") return 1;
    if (s === "selasa" || s === "tuesday" || s === "tue" || s === "2") return 2;
    if (s === "rabu" || s === "wednesday" || s === "wed" || s === "3") return 3;
    if (s === "kamis" || s === "thursday" || s === "thu" || s === "4") return 4;
    if (s === "jumat" || s === "friday" || s === "fri" || s === "5") return 5;
    if (s === "sabtu" || s === "saturday" || s === "sat" || s === "6") return 6;
  }
  // Default to today in WITA timezone (UTC+8)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const witaTime = new Date(utc + 8 * 3600000);
  return witaTime.getDay();
}

/**
 * Retrieves a single StoryDraft by slot and day.
 */
export function getStoryForSlot(slot: SlotTime, dayInput?: string | number | null): StoryDraft | null {
  const dayIndex = parseDayIndex(dayInput);
  const daySchedule = WEEKLY_CONTENT_MATRIX[dayIndex] || WEEKLY_CONTENT_MATRIX[1];
  return daySchedule ? daySchedule[slot] || null : null;
}

/**
 * Returns a complete 5-slot DailyEdition for a specific date or day of week.
 */
export function getDailyEdition(dateInput: Date = new Date()): DailyEdition {
  const dayOfWeek = dateInput.getDay();
  const stories = WEEKLY_CONTENT_MATRIX[dayOfWeek] || WEEKLY_CONTENT_MATRIX[1];

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const yyyy = dateInput.getFullYear();
  const mm = String(dateInput.getMonth() + 1).padStart(2, "0");
  const dd = String(dateInput.getDate()).padStart(2, "0");

  const hasRuangPulihPromo = stories["12:00"]?.isRuangPulihPromo ?? false;

  return {
    date: `${yyyy}-${mm}-${dd}`,
    dayName: dayNames[dayOfWeek],
    hasRuangPulihPromo,
    stories,
  };
}
