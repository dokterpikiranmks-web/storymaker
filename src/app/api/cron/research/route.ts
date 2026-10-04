import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { hasDashboardAccess, isCronAuthorized } from "@/lib/auth";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign, scheduleSlides } from "@/lib/campaigns";
import { getAppTimezone, todayInTimezone } from "@/lib/env";
import { isGeminiConfigured } from "@/lib/gemini/detector";
import { generateStructured } from "@/lib/gemini/generate";
import { getPersona } from "@/lib/settings";
import { generateFourActStory } from "@/lib/stories/engine";
import type { LeadMagnetProtocol, LeadMagnetProtocolStep } from "@/lib/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RotatingPillar {
  domainKey: string;
  category: string;
  pillar: string;
  focus: string;
  clinicalKnowledge: string;
  herbalFormula: {
    recipeName: string;
    ingredients: string;
    waterVolume: string;
    brewMethod: string;
    timing: string;
  };
  curatedCase: {
    topic: string;
    clinicalComplaint: string;
    coreInsight: string;
    socialProofCase: string;
    lead_magnet_protocol: LeadMagnetProtocol;
  };
}

/**
 * Rotasi 7 Tema Mingguan Dokter Pikiran Scout (WITA / Asia/Makassar):
 * - Senin : Metabolisme & Energi Harian (Keyword: ENERGI)
 * - Selasa: Kesehatan Pencernaan, GERD & Gut Health (Keyword: LAMBUNG)
 * - Rabu  : Postur Kerja, Tulang Belakang & Saraf Kejepit (Keyword: POSTUR)
 * - Kamis : Kognitif, Fokus Otak & Mental Burnout (Keyword: FOKUS)
 * - Jumat : Ritme Sirkadian, Kualitas Tidur & Insomnia (Keyword: INSOMNIA)
 * - Sabtu : Studi Kasus Nyata Meja Terapi & Detoks Fungsional (Keyword: TERAPI)
 * - Minggu: Mindset Bawah Sadar & Batasan Mental (Keyword: RESET)
 */
function getPillarForDate(date: Date, tz: string): RotatingPillar {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" });
  const weekday = formatter.format(date).toLowerCase();

  switch (weekday) {
    case "monday":
      return {
        domainKey: "SENIN_METABOLISME_ENERGI",
        category: "Metabolisme & Energi Harian",
        pillar: "Membangunkan Sistem Energi & Mengatasi Tubuh Lesu Bangun Tidur",
        focus:
          "Mengatasi kelelahan kronis saat bangun pagi, mengaktifkan metabolisme tanpa kafein berlebih, dan meredakan peradangan sendi/otot leher.",
        clinicalKnowledge:
          "Rasa lemas dan berat saat bangun pagi seringkali bukan karena kurang tidur, melainkan mitokondria sel kekurangan oksigen akibat pernapasan dangkal dan penumpukan asam metabolik. Formulasi jahe merah hangat dan stimulasi meridian membangkitkan panas alami tubuh seketika.",
        herbalFormula: {
          recipeName: "Seduhan Hangat Jahe Merah & Lada Hitam (Metabolic Igniter)",
          ingredients: "2 ruas jahe merah iris geprek + 3 butir lada hitam tumbuk kasar + 1 sdm madu murni",
          waterVolume: "250ml air panas 80°C",
          brewMethod: "Seduh air panas dalam cangkir tertutup selama 10 menit (jangan direbus mendidih agar minyak atsiri piperin & gingerol tidak menguap)",
          timing: "Minum hangat di pagi hari sebelum sarapan untuk membakar energi dan melancarkan mikrosirkulasi",
        },
        curatedCase: {
          topic: "Metabolisme & Energi Pagi: Rahasia Bangun Segar Tanpa Candu Kopi",
          clinicalComplaint:
            "Klien pria 38 tahun mengeluh selalu lemas bangun pagi, pundak kaku seperti memikul batu, dan harus minum 3 cangkir kopi hanya untuk bisa berpikir jernih.",
          coreInsight:
            "Kopi hanya meminjam energi masa depan dengan memeras kelenjar adrenal. Stimulasi titik leher GB-20 dan seduhan jahe ber-piperin membakar energi endogen murni dari dalam sel tubuh.",
          socialProofCase:
            "Gejala Pasien: Bangun tidur selalu lesu kronis 8 bulan dan pundak kaku. -> Temuan di Meja Terapi: Saraf servikal C5-C6 tertekan dan sirkulasi darah lambat akibat napas dangkal. -> Hasil Pemulihan: Setelah totok dekompresi meridian dan seduhan jahe-lada hitam, leher terasa ringan kapas dan energi pulih dalam 15 menit.",
          lead_magnet_protocol: {
            keyword: "ENERGI",
            title: "Panduan Saku Aktivasi Metabolisme & Energi Alami 3 Menit",
            target_issue: "Tubuh lemas bangun pagi, leher kaku, dan ketergantungan kafein",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 Leher Belakang: Stimulasi Mikrosirkulasi Otak",
                action: "Tekan lembut cekungan bawah tengkorak leher belakang selama 60 detik sambil bernapas diafragma teratur.",
                duration: "60 detik",
                mechanism: "Membuka arteri vertebralis sehingga suplai oksigen dan glukosa ke korteks otak meningkat seketika.",
              },
              {
                step: 2,
                title: "Formulasi Herbal Klinis: Seduhan Jahe Merah & Lada Hitam",
                action: "Seduh 2 iris jahe merah + seujung sendok lada hitam dengan 250ml air panas 80°C tertutup 10 menit. Minum selagi hangat.",
                duration: "60 detik",
                mechanism: "Kombinasi gingerol dan piperin meningkatkan bioavailabilitas antioksidan dan memacu termogenesis sel.",
              },
              {
                step: 3,
                title: "Sugesti Afirmasi Pagi: Pemrograman Vitalitas Bawah Sadar",
                action: "Tegakkan tulang belakang, sentuh ulu hati, dan afirmasikan: 'Tubuhku penuh energi alami, setiap selku bangun dengan segar.'",
                duration: "60 detik",
                mechanism: "Menyelaraskan reticular activating system (RAS) otak menuju kesiagaan mental yang tenang dan fokus.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah aktivasi energi biologis pagi hari: akupresur leher, formula seduhan jahe-lada hitam, dan priming fokus bawah sadar.",
          },
        },
      };

    case "tuesday":
      return {
        domainKey: "SELASA_PENCERNAAN_GERD",
        category: "Kesehatan Pencernaan, GERD & Gut Health",
        pillar: "Saraf Vagus Pencernaan & Penyelarasan Katup Lambung Alami",
        focus:
          "Meredakan asam lambung naik (GERD), perut kembung begah saat stres pekerjaan, dan memulihkan komunikasi sehat saraf usus-otak (gut-brain axis).",
        clinicalKnowledge:
          "Katup kerongkongan bawah (LES) dan asam lambung dikendalikan langsung oleh saraf vagus. Saat otak cemas dan dikejar target, darah dialihkan dari organ cerna, memicu kejang lambung dan asam naik ke dada.",
        herbalFormula: {
          recipeName: "Seduhan Rimpang Kunyit & Temulawak Pelindung Mukosa",
          ingredients: "1 ruas kunyit segar parut + 1 ruas temulawak geprek + sejumput garam laut murni",
          waterVolume: "200ml air panas 80°C",
          brewMethod: "Seduh air panas tertutup selama 8 menit lalu saring (jangan direbus agar zat kurkuminoid pelindung lambung tetap aktif utuh)",
          timing: "Minum hangat 30 menit sebelum makan siang atau saat perut mulai terasa perih begah",
        },
        curatedCase: {
          topic: "Asam Lambung & Cemas: Memutus Lingkaran Setan GERD & Saraf Vagus",
          clinicalComplaint:
            "Klien wanita 32 tahun mengeluh dada terasa terbakar, ulu hati tertusuk, dan tenggorokan mengganjal setiap kali memikirkan deadline kantor.",
          coreInsight:
            "Lambung adalah cermin pikiran emosional. Menekan titik akupresur ulu hati CV-12 dan merangsang rem alami tubuh saraf vagus langsung menenangkan asam lambung.",
          socialProofCase:
            "Gejala Pasien: Asam lambung naik menahun dan dada terasa sesak panas. -> Temuan di Meja Terapi: Spasme diafragma akibat menahan cemas bawah sadar yang mengunci katup lambung. -> Hasil Pemulihan: Totok meridian vagus dan seduhan kunyit-temulawak membuat dada plong seketika tanpa perih.",
          lead_magnet_protocol: {
            keyword: "LAMBUNG",
            title: "Panduan Saku Regulasi Saraf Vagus & Katup Lambung 3 Menit",
            target_issue: "GERD, asam lambung naik, perut begah, dan dada terasa sesak",
            steps: [
              {
                step: 1,
                title: "Titik CV-12 Ulu Hati & GB-20: Pelepasan Spasme Lambung",
                action: "Pijat lembut titik 4 jari di atas pusar (ulu hati) melingkar searah jarum jam selama 60 detik dibarengi napas perut.",
                duration: "60 detik",
                mechanism: "Menstimulasi pleksus celiacus dan meredakan ketegangan sfingter esofagus.",
              },
              {
                step: 2,
                title: "Formulasi Herbal Klinis: Seduhan Kunyit Temulawak 200ml",
                action: "Seduh parutan kunyit dan temulawak dengan 200ml air panas 80°C tertutup 8 menit. Minum hangat perlahan.",
                duration: "60 detik",
                mechanism: "Kurkumin dan kurkuminoid meredakan peradangan mukosa lambung dan memperkuat lapisan lendir lambung.",
              },
              {
                step: 3,
                title: "Napas Diafragma Dekompresi: Mengunci Sinyal Rileks",
                action: "Tarik napas perut 4 detik, tahan 7 detik, hembuskan 8 detik lewat mulut santai. Ulangi 4 kali.",
                duration: "60 detik",
                mechanism: "Tekanan ritmis diafragma mengembalikan posisi katup lambung dan mengaktifkan cabang parasimpatis.",
              },
            ],
            pdf_summary:
              "Protokol mandiri 3 menit pemulihan GERD dan perut begah: akupresur ulu hati, seduhan kunyit temulawak tertutup, dan napas diafragma saraf vagus.",
          },
        },
      };

    case "wednesday":
      return {
        domainKey: "RABU_POSTUR_TULANG_BELAKANG",
        category: "Postur Kerja, Tulang Belakang & Saraf Kejepit",
        pillar: "Dekompresi Servikal Leher, Belikat & Penyelarasan Tulang Belakang",
        focus:
          "Membebaskan leher kaku akibat posisi kepala maju ke layar (text neck), nyeri belikat menjalar ke tangan, dan saraf kejepit punggung bawah.",
        clinicalKnowledge:
          "Setiap kemiringan kepala 15 derajat ke depan menambah beban gravitasi setara 12 kg pada tulang servikal. Bantalan saraf tertekan dan otot trapezius mengeras seperti kawat baja.",
        herbalFormula: {
          recipeName: "Seduhan Serai Wangi & Kayu Manis Pelega Spasme Otot",
          ingredients: "2 batang serai wangi memarkan + 1 ruas jahe emprit geprek + 1 batang kecil kayu manis",
          waterVolume: "250ml air panas 80°C",
          brewMethod: "Seduh dalam wadah tertutup selama 10 menit (uap atsiri serai yang kaya sitronelal merilekskan otot lurik)",
          timing: "Minum hangat di sore hari setelah selesai duduk berjam-jam di depan komputer",
        },
        curatedCase: {
          topic: "Leher Kaku & Belikat Terjepit: Menyelaraskan Postur Layar Komputer",
          clinicalComplaint:
            "Klien programmer 29 tahun merasakan nyeri menusuk di belikat kanan menjalar ke jemari tangan setelah bekerja marathon 10 jam di depan laptop.",
          coreInsight:
            "Saraf terjepit bukan hanya masalah tulang, melainkan otot penyangga yang mengalami iskemia (kurang aliran darah). Dekompresi titik leher mengalirkan kembali darah segar.",
          socialProofCase:
            "Gejala Pasien: Nyeri belikat tajam dan kesemutan di jari tangan saat mengetik. -> Temuan di Meja Terapi: Spasme hebat muskulus trapezius dan kompresi servikal C6-C7. -> Hasil Pemulihan: Totok dekompresi tulang belakang dan peregangan meridian membuat kesemutan lenyap seketika.",
          lead_magnet_protocol: {
            keyword: "POSTUR",
            title: "Panduan Saku Dekompresi Servikal & Saraf Belikat 3 Menit",
            target_issue: "Leher kaku menatap layar, pundak membulat, dan nyeri belikat",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 & Chin Tuck: Traksi Mandiri Tulang Leher",
                action: "Tarik dagu lurus ke belakang (chin tuck) sambil kedua jempol menekan lembut cekungan tengkorak leher belakang 60 detik.",
                duration: "60 detik",
                mechanism: "Membuka foramen intervertebralis servikal dan meredakan jepitan akar saraf leher.",
              },
              {
                step: 2,
                title: "Formulasi Herbal: Seduhan Serai & Kayu Manis 250ml",
                action: "Nikmati seduhan serai dan kayu manis hangat untuk membantu relaksasi spasme jaringan myofascial.",
                duration: "60 detik",
                mechanism: "Senyawa sinamaldehid dan sitronelal bekerja sebagai relaksan otot alami dan anti-radang perifer.",
              },
              {
                step: 3,
                title: "Retraksi Belikat & Reset Pundak: Membuka Rongga Dada",
                action: "Putar kedua bahu ke belakang dan kebawah, tahan 5 detik, hembuskan napas panjang. Ulangi 6 kali.",
                duration: "60 detik",
                mechanism: "Mengaktifkan kembali otot romboid dan trapezius bawah yang melemah akibat duduk membungkuk.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah dekompresi leher dan belikat: traksi servikal mandiri, seduhan serai kayu manis, dan retraksi postur ergonomis.",
          },
        },
      };

    case "thursday":
      return {
        domainKey: "KAMIS_KOGNITIF_MENTAL_BURNOUT",
        category: "Kognitif, Fokus Otak & Mental Burnout",
        pillar: "Mengosongkan Beban Otak Nge-hang & Mengurai Cognitive Overflow",
        focus:
          "Mengatasi otak nge-hang kebanyakan mikir, kelelahan mental (mental burnout), sulit fokus, dan kepala berat seperti diikat kencang.",
        clinicalKnowledge:
          "Memori kerja manusia hanya sanggup menampung 4-7 informasi sekaligus. Saat puluhan tugas mengantre di kepala tanpa struktur, sirkuit prefrontal korteks mengalami panas berlebih (overheating).",
        herbalFormula: {
          recipeName: "Seduhan Daun Pegagan & Perasan Jeruk Nipis (Neuro-Clarity)",
          ingredients: "1 sdt daun pegagan kering (Centella asiatica) atau rosemary + 1 sdt madu + perasan 1/2 jeruk nipis",
          waterVolume: "200ml air panas 75°C",
          brewMethod: "Seduh tertutup selama 7 menit lalu tambahkan perasan jeruk nipis dan madu saat sudah hangat kuku",
          timing: "Minum di jam rawan kantuk / lelah otak (jam 14:00 - 15:30) untuk mengembalikan fokus tajam",
        },
        curatedCase: {
          topic: "Otak Nge-hang Kebanyakan Mikir: Mengembalikan Fokus Tajam & Jernih",
          clinicalComplaint:
            "Klien profesional 42 tahun merasa otaknya seperti komputer hang, tidak sanggup mengambil keputusan, dan sering lupa seketika di tengah obrolan.",
          coreInsight:
            "Otak bukan wadah penyimpanan tak terbatas. Kita harus me-restart instruksi lama di pikiran bawah sadar dan mematikan tab pikiran yang tidak relevan.",
          socialProofCase:
            "Gejala Pasien: Otak nge-hang, konsentrasi buyar, dan kepala berat diikat. -> Temuan di Meja Terapi: Gelombang otak terkunci di frekuensi beta tinggi tanpa istirahat. -> Hasil Pemulihan: Totok titik hening dahi dan hipno-reset instruksi lama membuat kepala kosong plong seketika.",
          lead_magnet_protocol: {
            keyword: "FOKUS",
            title: "Panduan Saku Reset Kognitif & Kejernihan Berpikir 3 Menit",
            target_issue: "Otak nge-hang, mental burnout, sulit fokus, dan kepala berat",
            steps: [
              {
                step: 1,
                title: "Titik Yintang (Dahi Tengah) & Pelipis: Tombol Jeda Pikiran",
                action: "Letakkan telunjuk di antara kedua alis (titik Yintang), putar lembut searah jarum jam sambil memejamkan mata 60 detik.",
                duration: "60 detik",
                mechanism: "Menurunkan aktivitas amigdala dan memindahkan fokus saraf pusat ke mode kejernihan meditatif.",
              },
              {
                step: 2,
                title: "Formulasi Herbal Klinis: Seduhan Daun Pegagan 200ml",
                action: "Minum seduhan daun pegagan hangat untuk merangsang sintesis brain-derived neurotrophic factor (BDNF).",
                duration: "60 detik",
                mechanism: "Kandungan asiatikosida dan madekasosida memperlancar aliran darah kapiler serebral otak.",
              },
              {
                step: 3,
                title: "Sugesti Penutupan Tab Pikiran: Mengosongkan Memori Kerja",
                action: "Katakan dalam hati: 'Semua urusan hari ini ada waktunya masing-masing. Kepalaku jernih, tenang, dan fokus pada satu hal.'",
                duration: "60 detik",
                mechanism: "Memprogram ulang pikiran bawah sadar untuk melepaskan kecemasan multitasking yang melelahkan.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah ergonomi kognitif: akupresur titik hening dahi, seduhan pegagan neuroprotektif, dan sugesti pengosongan tab pikiran.",
          },
        },
      };

    case "friday":
      return {
        domainKey: "JUMAT_RITME_SIRKADIAN_INSOMNIA",
        category: "Ritme Sirkadian, Kualitas Tidur & Insomnia",
        pillar: "Regulasi Gelombang Otak Menjelang Tidur & Pemulihan Insomnia Kronis",
        focus:
          "Memutus overthinking jam 11 malam, meredakan dada berdebar cemas saat terbangun dini hari, dan memicu tidur lelap gelombang delta alami.",
        clinicalKnowledge:
          "Pikiran sadar yang overthinking menghambat produksi melatonin di kelenjar pineal. Merangsang titik meridian penenang dan seduhan herbal GABA melunakkan sensor kritis otak.",
        herbalFormula: {
          recipeName: "Seduhan Bunga Telang & Sejumput Pala Murni (Deep Sleep Elixir)",
          ingredients: "5 kuntum bunga telang biru kering + sejumput kecil bubuk biji pala murni (Myristica fragrans) + madu",
          waterVolume: "200ml air panas 80°C",
          brewMethod: "Seduh bunga telang dan pala bubuk dalam air panas tertutup selama 7 menit hingga air berwarna biru tua safir",
          timing: "Minum hangat 45-60 menit sebelum waktu tidur di ruangan berpencahayaan redup",
        },
        curatedCase: {
          topic: "Insomnia & Overthinking Malam: Cara Memprogram Ketenangan Sebelum Tidur",
          clinicalComplaint:
            "Klien wanita 45 tahun mengalami insomnia kronis 2 tahun, hanya bisa tidur 2 jam per malam dan selalu terbangun dengan dada berdebar jam 3 pagi.",
          coreInsight:
            "Mendebat kecemasan di atas kasur justru bikin makin terjaga. Fisik harus dibuat rileks terlebih dahulu lewat stimulasi saraf vagus dan induksi gelombang theta.",
          socialProofCase:
            "Gejala Pasien: Insomnia kronis 2 tahun dan ketergantungan obat penenang. -> Temuan di Meja Terapi: Sensor kritis pikiran menolak tidur karena trauma alarm masa lalu. -> Hasil Pemulihan: Totok meridian vagus dan hipnoterapi theta membuat beliau tertidur lelap pulas dalam 10 menit.",
          lead_magnet_protocol: {
            keyword: "INSOMNIA",
            title: "Panduan Saku Reset Somatik & Ketenangan Tidur 3 Menit",
            target_issue: "Susah tidur, overthinking malam hari, dan dada berdebar cemas",
            steps: [
              {
                step: 1,
                title: "Titik Shenmen (Pergelangan Tangan) & GB-20 Leher",
                action: "Tekan lembut titik di lipatan pergelangan tangan bagian dalam sejajar kelingking (Shenmen) selama 60 detik bergantian.",
                duration: "60 detik",
                mechanism: "Merangsang jalur meridian jantung untuk meredakan palpitasi dada dan mendinginkan sistem saraf.",
              },
              {
                step: 2,
                title: "Formulasi Herbal: Seduhan Bunga Telang & Pala Bubuk 200ml",
                action: "Minum seduhan bunga telang hangat beraroma pala untuk menstimulasi reseptor GABA alami.",
                duration: "60 detik",
                mechanism: "Miristisin pada pala dan antosianin bunga telang bekerja sinergis menidurkan sensor siaga otak.",
              },
              {
                step: 3,
                title: "Sugesti Gelombang Theta: Izin Tubuh untuk Terlelap",
                action: "Letakkan telapak tangan di dada, pejamkan mata, katakan dalam hati: 'Hari ini sudah tuntas sempurna. Tubuhku aman beristirahat lelap.'",
                duration: "60 detik",
                mechanism: "Menanamkan perintah aman ke pikiran bawah sadar tepat saat transisi menuju fase tidur dalam.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah tidur lelap alami: stimulasi titik akupresur Shenmen, seduhan bunga telang pala penenang GABA, dan sugesti tidur theta.",
          },
        },
      };

    case "saturday":
      return {
        domainKey: "SABTU_KASUS_MEJA_TERAPI_DETOKS",
        category: "Studi Kasus Meja Terapi & Detoks Fungsional",
        pillar: "Pembersihan Ketegangan Fisik Menumpuk & Penyelarasan Meridian Tubuh",
        focus:
          "Membongkar timbunan ketegangan otot sepekan kerja, memperlancar drainase limfatik, dan detoksifikasi fungsional tubuh-pikiran terpadu.",
        clinicalKnowledge:
          "Asam laktat dan hormon kortisol yang terperangkap di fascia otot punggung selama sepekan memicu kekakuan menyeluruh. Meja terapi fungsional memadukan totok saraf fisik dengan pelepasan bawah sadar.",
        herbalFormula: {
          recipeName: "Seduhan Daun Salam, Jahe Merah & Ketumbar (Lymphatic Cleanse)",
          ingredients: "3 lembar daun salam tua remas + 1 ruas jahe merah memarkan + 1/2 sdt biji ketumbar sangrai memarkan",
          waterVolume: "300ml air panas 80°C",
          brewMethod: "Seduh tertutup selama 10 menit lalu saring (aroma eugenol dan linalool membantu pembersihan metabolit asam)",
          timing: "Minum sore hari di akhir pekan untuk mendukung detoksifikasi ginjal dan peredaran limfatik",
        },
        curatedCase: {
          topic: "Meja Terapi Holistik: Membongkar Ketegangan Tubuh yang Mengunci Sepekan",
          clinicalComplaint:
            "Klien pengusaha 50 tahun datang dengan seluruh punggung keras membatu, sesak napas saat lelah, dan rasa pegal menahun yang tak kunjung hilang.",
          coreInsight:
            "Tubuh menyimpan memori emosi beban tanggung jawab. Ketika meridian totok dibuka dan pikiran bawah sadar diajak melepaskan, tubuh langsung lemas rileks.",
          socialProofCase:
            "Gejala Pasien: Punggung mengeras seperti papan dan napas pendek menahun. -> Temuan di Meja Terapi: Blokade meridian kandung kemih dan ketegangan fascia emosional. -> Hasil Pemulihan: Totok saraf meridian limfatik membuat otot punggung seketika lemas dan tekanan darah stabil normal.",
          lead_magnet_protocol: {
            keyword: "TERAPI",
            title: "Panduan Saku Detoks Somatik & Drainase Meridian 3 Menit",
            target_issue: "Punggung kaku menumpuk sepekan, pegal linu kronis, dan badan berat",
            steps: [
              {
                step: 1,
                title: "Titik Meridian Belikat & Pangkal Tengkorak: Rilis Fascia",
                action: "Gunakan bola tenis atau jempol untuk menekan lembut titik antara tulang belikat dan tulang belakang 60 detik.",
                duration: "60 detik",
                mechanism: "Merilis trigger point myofascial yang mengunci aliran darah dan cairan limfatik punggung.",
              },
              {
                step: 2,
                title: "Formulasi Herbal: Seduhan Daun Salam & Ketumbar 300ml",
                action: "Konsumsi seduhan daun salam dan ketumbar hangat untuk membantu eliminasi asam sisa metabolisme.",
                duration: "60 detik",
                mechanism: "Kandungan flavonoid dan minyak atsiri memperlancar pembuangan toksin melalui sistem ekskresi.",
              },
              {
                step: 3,
                title: "Sugesti Pelepasan Beban Tanggung Jawab: Reset Utuh",
                action: "Hembuskan napas panjang lewat mulut, katakan dalam hati: 'Saya melepaskan semua beban yang bukan milik saya hari ini.'",
                duration: "60 detik",
                mechanism: "Memutus pola somatisasi stres emosional ke jaringan otot fisik di pikiran bawah sadar.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah pemulihan akhir pekan: rilis titik myofascial belikat, ramuan daun salam ketumbar, dan afirmasi pelepasan beban emosi.",
          },
        },
      };

    case "sunday":
    default:
      return {
        domainKey: "MINGGU_MINDSET_BATASAN_MENTAL",
        category: "Mindset Bawah Sadar & Batasan Mental",
        pillar: "Ketenangan Menghadapi Pekan Baru & Penataan Ulang Batasan Mental",
        focus:
          "Mengatasi kecemasan Minggu sore menjelang Senin (Sunday Scaries), menetapkan batasan mental yang sehat (mental boundaries), dan istirahat sejati.",
        clinicalKnowledge:
          "Istirahat sejati bukan sekadar berbaring pasif sambil terus scroll layar ponsel. Pikiran bawah sadar membutuhkan instruksi tegas bahwa akhir pekan adalah ruang aman yang sakral.",
        herbalFormula: {
          recipeName: "Seduhan Aromatik Daun Pandan & Kapulaga (Tranquil Mind)",
          ingredients: "2 lembar daun pandan wangi potong kecil + 3 butir kapulaga memarkan + 1 sdm madu",
          waterVolume: "250ml air panas 75°C",
          brewMethod: "Seduh tertutup selama 8 menit (aroma pandan dan minyak atsiri kapulaga langsung merelaksasi pusat limbik otak)",
          timing: "Minum santai di Minggu sore sambil jeda dari layar gawai untuk menyambut ketenangan malam",
        },
        curatedCase: {
          topic: "Sunday Scaries & Batasan Diri: Damai Menyambut Pekan Baru Tanpa Cemas",
          clinicalComplaint:
            "Klien ibu pekerja 36 tahun selalu merasa cemas dan sesak napas setiap Minggu jam 4 sore karena membayangkan beban pekerjaan hari Senin.",
          coreInsight:
            "Cemas hari Minggu adalah tanda batas mental yang bocor. Kita perlu membangun benteng ketenangan bawah sadar agar istirahat kita utuh berkualitas.",
          socialProofCase:
            "Gejala Pasien: Selalu panik dan cemas hebat setiap Minggu sore menjelang Senin. -> Temuan di Meja Terapi: Pemrograman bawah sadar yang merasa bersalah jika rileks santai. -> Hasil Pemulihan: Pemrograman ulang batas mental dan totok meridian dada menghasilkan rasa damai mendalam yang bertahan.",
          lead_magnet_protocol: {
            keyword: "RESET",
            title: "Panduan Saku Reset Pikiran Bawah Sadar & Batasan Diri 3 Menit",
            target_issue: "Cemas menjelang hari Senin, lelah mental, dan rasa bersalah saat santai",
            steps: [
              {
                step: 1,
                title: "Titik CV-17 (Dada Tengah) & GB-20: Penyeimbang Emosi",
                action: "Letakkan telapak tangan di tengah dada (titik CV-17), beri tekanan lembut melingkar 60 detik sambil bernapas tenang.",
                duration: "60 detik",
                mechanism: "Menenangkan gejolak saraf otonom dan memulihkan rasa damai di pusat emosional dada.",
              },
              {
                step: 2,
                title: "Formulasi Herbal: Seduhan Aromatik Pandan Kapulaga 250ml",
                action: "Hirup aroma harum pandan kapulaga lalu nikmati seduhannya hangat perlahan.",
                duration: "60 detik",
                mechanism: "Fitokimia aromatik pandan merangsang pelepasan endorfin dan meredakan ketegangan sistem limbik.",
              },
              {
                step: 3,
                title: "Sugesti Batasan Mental: Menjaga Kedamaian Batin",
                action: "Pejamkan mata dan afirmasikan: 'Pekan lalu sudah selesai. Besok ada waktunya sendiri. Saat ini tubuh dan pikiranku berhak damai.'",
                duration: "60 detik",
                mechanism: "Menanamkan batas mental yang kokoh di pikiran bawah sadar agar tidur malam berkualitas penuh.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah pemulihan utuh hari Minggu: stimulasi titik dada CV-17, seduhan pandan kapulaga aromatik, dan afirmasi batasan mental bawah sadar.",
          },
        },
      };
  }
}

async function researchWithGemini(
  pillar: RotatingPillar,
  campaignDate: string,
  customTopic?: string,
): Promise<{ topic: string; clinicalComplaint: string; coreInsight: string; lead_magnet_protocol: LeadMagnetProtocol }> {
  if (!isGeminiConfigured()) return pillar.curatedCase;

  const prompt = `Kamu adalah "Dokter Pikiran Scout", partner riset klinis dan sahabat pemulihan untuk Dokter Pikiran / Sang Alchemist (Hipnoterapis Klinis, Praktisi Totok Saraf Meridian, dan Solo AI Developer).
Tugasmu: Merumuskan 1 studi kasus keluhan harian yang sangat nyata dan membumi untuk tanggal ${campaignDate}, lengkap dengan protokol lead magnet 3 langkah yang siap di-render menjadi PDF.

# ATURAN EMAS BAHASA & PERSONA (WAJIB DIIKUTI):
- DILARANG KERAS menggunakan istilah medis/anatomi rumit tanpa analogi sehari-hari!
- WAJIB menerjemahkan konsep teknis ke bahasa awam yang renyah dan membumi:
  * "Spasme suboksipital" -> "Otot leher belakang yang kaku tegang"
  * "Nervus vagus / sistem simpatik" -> "Rem darurat alami tubuh kita"
  * "Gut-brain axis" -> "Hubungan perut begah/asam lambung dengan pikiran cemas"
  * "Cognitive load overflow" -> "Otak nge-hang kebanyakan mikir"
  * "Aktivasi parasimpatik" -> "Sinyal aman agar tubuh bisa bernapas lega dan rileks"
- Gaya bahasa: Hangat, empatik, seperti seorang praktisi senior sekaligus sahabat yang mengerti beban hidup audiens. Mengalir renyah, pendek-pendek (cocok untuk WhatsApp Status), tidak bertele-tele.

Matriks Inspirasi Hari Ini:
- Domain Utama: ${pillar.category}
- Fokus Bahasan: ${pillar.pillar}
- Intisari Solusi: ${pillar.focus}
- Formulasi Herbal Teruji: ${pillar.herbalFormula.recipeName} (${pillar.herbalFormula.ingredients}, ${pillar.herbalFormula.waterVolume}, ${pillar.herbalFormula.brewMethod}, waktu: ${pillar.herbalFormula.timing})
- Bukti Sosial Meja Terapi: ${pillar.curatedCase.socialProofCase}
${customTopic ? `- Topik Arahan Khusus: "${customTopic}"` : ""}

Kriteria Wajib Output:
1. "topic": Topik/judul memikat dalam bahasa awam tentang hubungan tubuh-pikiran (maks 12 kata, tanpa emoji/hashtag).
2. "clinicalComplaint": Narasi curhat keluhan nyata klien di meja terapi yang emosional dan manusiawi (misal leher kaku, perut begah, otak nge-hang kebanyakan mikir).
3. "coreInsight": Wawasan pencerahan yang menghubungkan rem darurat tubuh (saraf vagus), totok leher, dan reset instruksi lama di pikiran bawah sadar.
4. "lead_magnet_protocol": Protokol 3 langkah resmi siap cetak PDF dengan KATA KUNCI DINAMIS:
   - "keyword": 1 kata kunci unik huruf kapital (maksimal 1 kata, mudah diketik di ponsel, relevan dengan masalah tubuh, contoh: "LEHER", "LAMBUNG", "INSOMNIA", "FOKUS", "BELIKAT", "MIGRAIN").
   - "title": Judul panduan (misal: "Panduan Saku Reset Somatik & Saraf Vagus").
   - "target_issue": Masalah spesifik yang diatasi.
   - "steps": Array persis 3 objek langkah terstruktur:
       { "step": 1, "title": "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital", "action": "instruksi tekan titik leher belakang", "duration": "60 detik", "mechanism": "mengendurkan otot leher kaku & melancarkan aliran darah ke kepala" },
       { "step": 2, "title": "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus", "action": "tarik napas 4 detik, tahan 7 detik, hembus perlahan 8 detik", "duration": "60 detik", "mechanism": "mengaktifkan rem alami tubuh menurunkan detak jantung dan rasa cemas" },
       { "step": 3, "title": "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar", "action": "sentuh dada tengah, afirmasi tubuh aman untuk istirahat", "duration": "60 detik", "mechanism": "menanamkan ketenangan di pikiran bawah sadar sebelum lelap" }
   - "pdf_summary": Ringkasan eksekutif 2-3 kalimat yang membumi dan siap dicetak ke halaman depan PDF panduan.

Hasilkan JSON valid sesuai format persis:
{
  "topic": "...",
  "clinicalComplaint": "...",
  "coreInsight": "...",
  "lead_magnet_protocol": {
    "keyword": "...",
    "title": "...",
    "target_issue": "...",
    "steps": [
      { "step": 1, "title": "...", "action": "...", "duration": "...", "mechanism": "..." },
      { "step": 2, "title": "...", "action": "...", "duration": "...", "mechanism": "..." },
      { "step": 3, "title": "...", "action": "...", "duration": "...", "mechanism": "..." }
    ],
    "pdf_summary": "..."
  }
}`;

  try {
    const res = await generateStructured<{
      topic: string;
      clinicalComplaint: string;
      coreInsight: string;
      lead_magnet_protocol: LeadMagnetProtocol;
    }>(
      prompt,
      "Hasilkan hanya JSON valid sesuai schema tanpa teks pembuka atau markdown di luar json.",
      (text) => {
        let t = text.trim();
        const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fence) t = fence[1].trim();
        const parsed = JSON.parse(t);

        const rawProtocol = (parsed.lead_magnet_protocol && typeof parsed.lead_magnet_protocol === "object"
          ? parsed.lead_magnet_protocol
          : pillar.curatedCase.lead_magnet_protocol) as Record<string, unknown>;

        const rawSteps = Array.isArray(rawProtocol.steps) ? rawProtocol.steps : pillar.curatedCase.lead_magnet_protocol.steps;
        const steps: LeadMagnetProtocolStep[] = rawSteps.slice(0, 3).map((st: unknown, idx: number) => {
          const s = (st && typeof st === "object" ? st : {}) as Record<string, unknown>;
          const fallbackStep = pillar.curatedCase.lead_magnet_protocol.steps[idx] ?? pillar.curatedCase.lead_magnet_protocol.steps[0];
          return {
            step: idx + 1,
            title: String(s.title || fallbackStep.title).trim(),
            action: String(s.action || fallbackStep.action).trim(),
            duration: String(s.duration || fallbackStep.duration || "60 detik").trim(),
            mechanism: String(s.mechanism || fallbackStep.mechanism).trim(),
          };
        });

        const rawKeyword = String(rawProtocol.keyword || pillar.curatedCase.lead_magnet_protocol.keyword || "RESET")
          .trim()
          .toUpperCase()
          .replace(/[^A-Za-z0-9]/g, "")
          .split(/\s+/)[0];

        const leadMagnetProtocol: LeadMagnetProtocol = {
          keyword: rawKeyword || pillar.curatedCase.lead_magnet_protocol.keyword || "RESET",
          title: String(rawProtocol.title || pillar.curatedCase.lead_magnet_protocol.title).trim(),
          target_issue: String(rawProtocol.target_issue || pillar.curatedCase.lead_magnet_protocol.target_issue).trim(),
          steps,
          pdf_summary: String(rawProtocol.pdf_summary || pillar.curatedCase.lead_magnet_protocol.pdf_summary).trim(),
        };

        return {
          topic: String(parsed.topic || pillar.curatedCase.topic).trim(),
          clinicalComplaint: String(parsed.clinicalComplaint || pillar.curatedCase.clinicalComplaint).trim(),
          coreInsight: String(parsed.coreInsight || pillar.curatedCase.coreInsight).trim(),
          lead_magnet_protocol: leadMagnetProtocol,
        };
      },
      { json: true, temperature: 0.8 },
    );
    return res.data;
  } catch (err) {
    console.warn("[Dokter Pikiran Scout] Gemini research fallback to curated case:", (err as Error).message);
    return pillar.curatedCase;
  }
}

/**
 * POST & GET /api/cron/research — Autonomous Clinical Research Agent ("Dokter Pikiran Scout")
 * 1. Amankan endpoint dengan Bearer Token (CRON_SECRET / WORKER_SECRET) ATAU Dashboard Session.
 * 2. Tentukan kategori tema otomatis berputar berdasarkan 3 domain klinis utama.
 * 3. Dokter Pikiran Scout meriset keluhan klinis & generate naskah 4 babak lengkap + payload lead_magnet_protocol.
 * 4. Render langsung ke visual poster 9:16 via Satori dan simpan ke Supabase Storage (rendered-slides).
 * 5. Simpan campaign dan set jadwal posting otomatis (07:15, 12:30, 18:45, 21:30).
 */
async function handleResearch(req: Request) {
  const authorized = isCronAuthorized(req) || (await hasDashboardAccess(req));
  if (!authorized) return jsonError("Unauthorized", 401);

  let body: { topic?: string; campaign_date?: string; overwrite?: boolean } = {};
  if (req.method === "POST") {
    body = ((await readJson(req).catch(() => ({}))) as typeof body) ?? {};
  }

  const tz = getAppTimezone();
  const campaignDate = body.campaign_date || todayInTimezone();
  const dateObj = new Date(campaignDate + "T12:00:00Z");
  const pillar = getPillarForDate(dateObj, tz);
  const overwrite = body.overwrite !== false;

  try {
    const existing = await getCampaignRowByDate(campaignDate, "DAILY_AUTONOMOUS");
    if (existing && !overwrite) {
      return jsonError(`Campaign untuk tanggal ${campaignDate} sudah ada.`, 409, { existingCampaignId: existing.id });
    }

    const persona = await getPersona();
    const requestId = randomUUID();

    // 1. Dokter Pikiran Scout riset keluhan klinis 3 domain + lead_magnet_protocol
    const scoutData = await researchWithGemini(pillar, campaignDate, body.topic);
    const rawThought = `${scoutData.clinicalComplaint}\n\nCore Insight: ${scoutData.coreInsight}`;

    // 2. Generate naskah 4 babak lengkap (Pattern Interrupt, Somatic, Clinical-AI, Anchor + CTA)
    const { story, info } = await generateFourActStory({
      topic: scoutData.topic,
      rawThought,
      campaignDate,
      persona,
      requestId,
      campaignType: "DAILY_AUTONOMOUS",
      leadMagnetProtocol: scoutData.lead_magnet_protocol,
    });

    if (!story.lead_magnet_protocol) {
      story.lead_magnet_protocol = scoutData.lead_magnet_protocol;
    }

    // 3. Simpan campaign ke Supabase Database sebagai DAILY_AUTONOMOUS
    const campaignId = await saveGeneratedCampaign({
      campaignDate,
      topic: scoutData.topic,
      rawThought: scoutData.clinicalComplaint,
      story,
      info,
      campaignType: "DAILY_AUTONOMOUS",
    });

    // 4. Render visual poster 9:16 melalui Satori dan simpan ke Supabase Storage (rendered-slides)
    const renderErrors = await renderCampaignSlides(campaignId);

    // 5. Set jadwal posting otomatis (07:15, 12:30, 18:45, 21:30) untuk WhatsApp
    const { slides: scheduledSlides, pastDue } = await scheduleSlides(campaignId, {
      mode: "schedule",
      channels: { whatsapp: true, instagram: false },
    });

    const campaign = await getCampaign(campaignId);

    return jsonOk({
      ok: true,
      agent: "Dokter Pikiran Scout",
      domain: pillar.domainKey,
      pillar: pillar.category,
      focus: pillar.focus,
      campaignDate,
      campaign,
      lead_magnet_protocol: scoutData.lead_magnet_protocol,
      renderErrors,
      scheduledSlidesCount: scheduledSlides.length,
      pastDue,
      generation: info,
    });
  } catch (err) {
    return handleRouteError(err, "cron/research");
  }
}

export async function POST(req: Request) {
  return handleResearch(req);
}

export async function GET(req: Request) {
  return handleResearch(req);
}
