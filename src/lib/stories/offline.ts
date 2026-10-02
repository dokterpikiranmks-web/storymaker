import { ACTS, type ActType } from "./constants";
import type { GeneratedAct, GeneratedStory, LeadMagnetProtocol, PersonaSettings } from "./types";
import { hashString } from "@/lib/utils";

/**
 * Offline Alchemist — deterministic template engine used when Gemini is not
 * configured or the whole model cascade is cooling down. Guarantees the user
 * request never fails (PRD §3.1 "tanpa membuat request pengguna gagal").
 */

function words(value: string, max: number): string {
  const list = value.split(/\s+/).filter(Boolean);
  return list.length <= max ? list.join(" ") : `${list.slice(0, max).join(" ")}…`;
}

export function deriveTopicPhrase(topic?: string, rawThought?: string): string {
  const cleanTopic = topic?.replace(/\s+/g, " ").replace(/[*"]/g, "").trim();
  if (cleanTopic) return words(cleanTopic, 7);
  const raw = rawThought?.replace(/\s+/g, " ").replace(/[*"]/g, "").trim();
  if (!raw) return "pikiran yang tidak mau diam";
  const firstClause = raw.split(/[.!?;:\n]/)[0] ?? raw;
  return words(firstClause, 6).replace(/^(aku|saya|tadi|jadi|hari ini)\s+/i, "");
}

type Builder = (t: string, p: PersonaSettings) => Omit<GeneratedAct, "act" | "visual_theme">;

const TEMPLATES: Record<ActType, Builder[]> = {
  ACT_1_HOOK: [
    (t) => ({
      headline: `Yang kamu lawan *bukan* ${t}`,
      body_text:
        "Perhatikan pagi ini: saat pikiran bilang \"aku baik-baik saja\", otot leher belakang dan rahangmu justru mengeras kaku.\n\nSiang nanti jam 12:30, saya tunjukkan 1 titik saraf di leher yang kalau ditekan 30 detik langsung bikin nafas enteng.",
      call_to_action: "Tunggu panduannya siang nanti jam 12:30.",
      caption: `Pagi ini aku mau jujur soal ${t}.\n\nYang kita kira masalah otak kebanyakan mikir, seringkali adalah sinyal tubuh yang belum sempat kita dengarkan. Otot leher belakang kaku mengunci alarm siaga tubuh.\n\nSiang nanti jam 12:30 aku tunjukkan titik peredanya. Pantau terus ya 🌿\n\n#totoksaraf #remalami #kesehatantubuh`,
      technique: "Open loop + jembatan siang (retention hook)",
      key_element: "Hook pagi: tubuh melapor lebih dulu, janji teknik titik leher jam 12:30.",
    }),
    (t) => ({
      headline: `Makin dipikirkan, *otak makin nge-hang*`,
      body_text: `Ini paradoks yang sering kulihat di meja terapi soal ${t}. Otak yang dipaksa mencari jalan keluar justru terkunci kelelahan.\n\nSiang nanti jam 12:30, saya tunjukkan 1 titik saraf di leher yang kalau ditekan 30 detik langsung bikin nafas enteng.`,
      call_to_action: "Jawabannya siang nanti jam 12:30.",
      caption: `Pernah merasa makin dipikirkan, kepala makin berat seperti diikat? Itu tanda rem darurat alami tubuhmu butuh diaktifkan.\n\nSolusinya ada di tubuh, bukan debat di kepala.\n\nSiang ini jam 12:30 aku bocorkan titiknya 👀\n\n#otakngehang #remdarurat #relaksasi`,
      technique: "Pattern interrupt + curiosity gap",
      key_element: "Hook pagi: otak nge-hang, janji titik leher jam 12:30.",
    }),
  ],
  ACT_2_SOMATIC: [
    () => ({
      headline: `Tekan titik ini, *nafas langsung enteng*`,
      body_text:
        "Sesuai janji tadi pagi: letakkan dua jempol di cekungan pangkal tengkorak leher belakang. Tekan lembut 30 detik sambil hembuskan napas panjang.\n\nTapi kenapa leher bisa sekaku ini padahal nggak angkat beban? Jawabannya ada di 'kabel emosi' yang kita bahas nanti sore.",
      call_to_action: "Coba sekarang, lalu tunggu sore jam 18:45.",
      caption:
        "Sesuai janji tadi pagi 🙏\n\nTitik GB-20 di cekungan leher belakang ini langsung menyalakan rem darurat alami tubuh (saraf vagus). Nafas seketika terasa plong dan bahu turun santai.\n\nPenasaran kenapa leher bisa kaku tanpa sebab fisik? Kita kupas sore nanti jam 18:45 ✨\n\n#totokleher #remdarurat #nafasplong",
      technique: "Somatic release + jembatan sore",
      key_element: "Teknik siang: menyapa pagi, tekan titik leher GB-20, lempar hook kabel emosi sore.",
    }),
    (t) => ({
      headline: `Sesuai janji pagi: *rem darurat tubuh*`,
      body_text: `Untuk ${t}, kita mulai dari fisik: tekan lembut titik cekungan leher belakang sambil buang napas perlahan lewat mulut seperti meniup lilin.\n\nTapi kenapa leher bisa sekaku ini padahal nggak angkat beban? Jawabannya ada di 'kabel emosi' yang kita bahas nanti sore.`,
      call_to_action: "Praktikkan sekarang, kita sambung sore nanti.",
      caption:
        "Sesuai janji tadi pagi, ini rahasianya.\n\nPikiran yang panik tidak bisa didebat dengan kata-kata, tapi tubuh bisa diajak melambat lewat rem alami tubuh.\n\nLalu apa hubungan leher kaku ini dengan emosi yang tertahan? Sore nanti jam 18:45 kita bahas tuntas 🌿\n\n#remalami #leherkaku #sarafvagus",
      technique: "Bottom-up regulation + open loop sore",
      key_element: "Teknik siang: menyapa pagi, panduan napas & titik leher, lempar hook sore.",
    }),
  ],
  ACT_3_CLINICAL_AI: [
    (t) => ({
      headline: `Tubuh kaku karena *instruksi lama*`,
      body_text: `Melanjutkan titik leher tadi siang: seorang klien datang dengan keluhan ${t}. Lehernya kaku bukan karena beban fisik, melainkan 'kabel emosinya' terus mengirim alarm siaga.\n\nNanti malam jam 21:30 sebelum tidur, kita reset pikiran bawah sadarmu.`,
      call_to_action: "Siapkan dirimu malam ini jam 21:30.",
      caption:
        "Melanjutkan titik leher tadi siang...\n\nSama seperti sistem komputer yang butuh restart saat nge-hang, tubuh kita kaku tegang karena pikiran bawah sadar masih menjalankan instruksi lama yang usang.\n\nMalam ini jam 21:30 kita reset bersama sebelum tidur 🌙\n\n#kabelemosi #instruksilama #resetpikiran",
      technique: "Reframing bahasa awam + jembatan malam",
      key_element: "Koneksi sore: menyambung titik leher siang, analogi instruksi lama, lempar hook malam.",
    }),
    (t) => ({
      headline: `Di meja terapi, kita *restart sistem*`,
      body_text: `Melanjutkan bahasan siang tadi: leher kaku pada kasus ${t} adalah sinyal kabel emosi yang korslet. Pikiran terus bekerja lembur tanpa sadar.\n\nNanti malam jam 21:30 sebelum tidur, kita reset pikiran bawah sadarmu.`,
      call_to_action: "Tunggu panduannya malam ini jam 21:30.",
      caption:
        "Melanjutkan titik leher tadi siang...\n\nKita tidak perlu melawan rasa cemasnya. Yang kita lakukan adalah merestart sistem dari akar: memutus instruksi lama yang bikin leher mengunci.\n\nMalam ini jam 21:30 ada panduan relaksasi tidur untukmu 💤\n\n#terapisaraf #restartotak #ketenanganmalam",
      technique: "Metafora restart sistem + hook malam",
      key_element: "Koneksi sore: menyambung siang, analogi restart otak, hook malam jam 21:30.",
    }),
  ],
  ACT_4_ANCHOR: [
    (_t, p) => ({
      headline: `Malam ini, *izinkan tubuhmu* beristirahat`,
      body_text:
        "Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore... malam ini letakkan tangan di dadamu. Izinkan bahumu melepas semua beban hari ini.\n\nBesok pagi kamu bangun dengan kepala yang jauh lebih enteng.",
      call_to_action: `KETIK '${p.ctaKeyword}' untuk panduan lengkap PDF`,
      caption: `Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore... sekarang saatnya tubuhmu pulih sepenuhnya.\n\nSentuh dadamu, bernapas perlahan, izinkan tidurmu lelap malam ini.\n\nMau panduan lengkap PDF 3 langkahnya? KETIK '${p.ctaKeyword}' di chat WhatsApp 🌙\n\n#tidurnyenyak #afirmasitidur #resetvagus`,
      technique: "Rangkuman seharian + afirmasi tidur + CTA",
      key_element: "Sugesti malam: merangkum seharian (pagi-siang-sore), afirmasi dada, CTA kata kunci WhatsApp.",
    }),
    (_t, p) => ({
      headline: `Sentuh dadamu. *Hari ini sudah tuntas.*`,
      body_text:
        "Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore: perjalanan tubuhmu hari ini luar biasa. Sentuh dadamu, rasakan kehangatannya, dan izinkan pikiranmu beristirahat damai.",
      call_to_action: `KETIK '${p.ctaKeyword}' di WA untuk panduan PDF`,
      caption: `Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore...\n\nKamu sudah berjuang seharian. Malam ini tubuhmu berhak atas kedamaian dan pemulihan utuh.\n\nKetik '${p.ctaKeyword}' di WhatsApp kalau kamu ingin dokumen panduan PDF lengkapnya 🤍\n\n#pemulihantubuh #afirmasimalam #drMind`,
      technique: "Rangkuman narasi + anchoring damai + CTA",
      key_element: "Sugesti malam: merangkum perjalanan seharian, penanaman rasa aman, CTA WhatsApp.",
    }),
  ],
};

export function buildOfflineAct(act: ActType, topicPhrase: string, persona: PersonaSettings, seed: number): GeneratedAct {
  const variants = TEMPLATES[act];
  const builder = variants[(seed + ACTS[act].index) % variants.length];
  return { act, visual_theme: ACTS[act].defaultTheme, ...builder(topicPhrase, persona) };
}

export function buildDefaultLeadMagnetProtocol(topicPhrase: string): LeadMagnetProtocol {
  return {
    title: `Panduan Saku Reset Somatik & Saraf Vagus: ${topicPhrase}`,
    target_issue: `Meredakan otot leher kaku, rem darurat tubuh, dan overthinking terkait ${topicPhrase}`,
    steps: [
      {
        step: 1,
        title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
        action:
          "Letakkan kedua jempol di cekungan pangkal tengkorak belakang leher (titik batas antara kepala dan leher). Berikan tekanan lembut mengarah ke atas selama 60 detik sambil memejamkan mata dan bernapas perlahan.",
        duration: "60 detik",
        mechanism:
          "Mengendurkan otot leher belakang yang tegang kaku, melancarkan aliran darah ke otak, dan mematikan alarm siaga tubuh.",
      },
      {
        step: 2,
        title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
        action:
          "Tarik napas lembut lewat hidung 4 detik, tahan napas santai 7 detik, lalu hembuskan perlahan lewat mulut seperti meniup lilin selama 8 detik. Ulangi 4 hingga 5 siklus.",
        duration: "60 detik",
        mechanism:
          "Hembusan napas yang panjang merangsang saraf vagus (rem alami tubuh) untuk menurunkan denyut jantung dan memicu rasa tenang seketika.",
      },
      {
        step: 3,
        title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
        action:
          "Letakkan telapak tangan kanan di tengah dada. Rasakan kehangatan napasmu, turunkan bahu santai, dan katakan dalam hati: 'Hari ini sudah selesai, tubuhku aman untuk beristirahat dan pulih sepenuhnya.'",
        duration: "60 detik",
        mechanism:
          "Menanamkan rasa aman di pikiran bawah sadar dan memindahkan gelombang otak ke status Alpha tenang untuk tidur lelap berkualitas.",
      },
    ],
    pdf_summary: `Protokol klinis 3 langkah mandiri untuk meredakan ketegangan leher, mengaktifkan rem darurat alami tubuh, dan menenangkan pikiran dalam waktu 3 menit.`,
  };
}

export function generateOfflineStory(input: {
  topic?: string;
  rawThought?: string;
  persona: PersonaSettings;
  campaignType?: "DAILY_AUTONOMOUS" | "FLASH_PROMO";
  flashPromo?: import("./types").FlashPromoInput;
}): GeneratedStory {
  const phrase = deriveTopicPhrase(input.topic, input.rawThought);
  const seed = hashString(`${input.topic ?? ""}|${input.rawThought ?? ""}`);

  if (input.campaignType === "FLASH_PROMO" && input.flashPromo) {
    const fp = input.flashPromo;
    if (fp.subtype === "THERAPY_SLOT") {
      const therapyName = fp.therapyType === "TOTOK_SARAF" ? "Totok Saraf & Meridian Vagus" : fp.therapyType === "HIPNOTERAPI" ? "Hipnoterapi Klinis" : "Totok Saraf & Hipnoterapi";
      const slots = fp.remainingSlots ?? 3;
      const dateStr = fp.practiceDate ?? "Pekan Ini";
      return {
        theme_topic: `Flash Promo: Sisa ${slots} Slot ${therapyName}`,
        core_insight: `Keseimbangan sistem saraf dan pikiran bawah sadar dapat dipulihkan dalam satu sesi tatap muka terarah.`,
        acts: [
          {
            act: "ACT_1_HOOK",
            headline: `Tubuhmu sudah *terlalu lama* menahan beban ini`,
            body_text: `Perhatikan ketegangan di leher, pundak, atau rasa cemas tak berujung yang kamu bawa pekan ini. Saraf tubuhmu butuh pelepasan nyata, bukan sekadar kata-kata motivasi.\n\nKabar baik: ada kesempatan langka pekan ini.`,
            call_to_action: "Simpan slotmu sebelum kehabisan.",
            caption: `Banyak dari kita terbiasa menormalisasi rasa lelah, leher kaku, dan overthinking menahun.\n\nPekan ini aku buka sesi tatap muka ${therapyName} untuk membantu me-reboot sistem saraf otonommu langsung dari akarnya.\n\nSisa slot sangat terbatas ⚡\n\n#totoksaraf #hipnoterapi #klinis`,
            visual_theme: "Neuro-Dark",
            technique: "Scarcity ethically anchored with somatic urgency",
            key_element: "Hook: tubuh butuh intervensi fisik/mental nyata sekarang.",
          },
          {
            act: "ACT_2_SOMATIC",
            headline: `Apa yang terjadi di *meja terapi*`,
            body_text: `Kami menelusuri titik simpul saraf di jalur meridian leher dan tengkorak (GB-20 & nervus vagus). Dengan stimulasi presisi, spasme fasia melepaskan hormon relaksasi seketika.\n\nNapas menjadi dalam, otot melemas dalam hitungan menit.`,
            call_to_action: "Rasakan perubahan sejak menit pertama.",
            caption: `Di sesi ${therapyName}, kita tidak hanya mengobrol. Kita langsung mengakses sistem saraf otonom dan memori tubuh.\n\nBegitu titik kunci terbuka, sinyal 'bahaya' yang bertahun-tahun tertahan di amigdala akhirnya dimatikan.\n\n#reboot #sarafvagus #functionalmedicine`,
            visual_theme: "Somatic-Clean",
            technique: "Biological explanation + trust building",
            key_element: "Penjelasan mekanisme stimulasi titik meridian & vagus.",
          },
          {
            act: "ACT_3_CLINICAL_AI",
            headline: `Transformasi nyata: *dari tegang menjadi plong*`,
            body_text: `Klien minggu lalu datang dengan kepala berat dan insomnia akut. Setelah 60 menit pelepasan somatik dan hipnoterapi bawah sadar, dia tersenyum:\n\n"Rasanya seperti baru pertama kali bernapas lega setelah 2 tahun."`,
            call_to_action: "Kini giliran tubuhmu yang pulih.",
            caption: `Menyaksikan klien berdiri dari meja terapi dengan tatapan mata yang kembali hidup adalah alasan kenapa aku mendedikasikan hidup untuk karya ini.\n\nPikiran bawah sadar dan tubuh fisikmu diciptakan untuk bisa pulih.\n\n#testimoni #terapi #sembuhalami`,
            visual_theme: "Hacker-Terminal",
            technique: "Social proof + subconscious relief anticipation",
            key_element: "Studi kasus transformasi nyata di meja terapi.",
          },
          {
            act: "ACT_4_ANCHOR",
            headline: `Hanya tersisa *${slots} slot* untuk *${dateStr}*`,
            body_text: `Praktek dibuka terbatas agar setiap sesi mendapatkan fokus 100% tanpa terburu-buru.\n\nAmankan tempatmu sekarang sebelum slot ditutup malam ini.`,
            call_to_action: `KETIK '${input.persona.ctaKeyword}' untuk amankan jadwal`,
            caption: `Jadwal praktek ${therapyName} untuk ${dateStr} resmi dibuka. Tersisa hanya ${slots} slot terakhir.\n\nBeri tubuhmu hadiah terbaik untuk pulih dan berfungsi optimal kembali.\n\nKetik '${input.persona.ctaKeyword}' sekarang di WhatsApp 📲\n\n#jadwalterapi #slotpromo #totoksaraf`,
            visual_theme: "Minimal-Hypnotic",
            technique: "Direct CTA + deadline urgency",
            key_element: "Pengumuman slot terbatas + CTA chat WhatsApp.",
          },
        ],
        lead_magnet_protocol: buildDefaultLeadMagnetProtocol(therapyName),
      };
    }

    if (fp.subtype === "APP_SHOWCASE") {
      const appName = fp.appName ?? "AI Productivity Suite";
      const solution = fp.appSolution ?? "Mengurai beban kognitif dan context window pikiran";
      return {
        theme_topic: `Flash Promo: Solusi Cerdas ${appName}`,
        core_insight: `Teknologi terbaik adalah yang mengurangi beban kerja otak manusia, bukan yang menambahnya.`,
        acts: [
          {
            act: "ACT_1_HOOK",
            headline: `Otakmu bukan *hard disk*, jangan paksa *menyimpan segalanya*`,
            body_text: `Berapa banyak tab yang terbuka di browser dan kepalamu saat ini? Brain fog dan lupa hal penting bukan karena kamu tidak mampu, melainkan karena context window pikiranmu sudah kepenuhan.\n\nAda cara cerdas mengatasinya.`,
            call_to_action: "Bebaskan kapasitas RAM otakmu.",
            caption: `Sebagai solo developer dan terapis, aku sering melihat orang burnout hanya karena sistem kerjanya tidak mendukung kapasitas biologis otak.\n\nSaat informasi menumpuk, kreativitas mati. Hari ini aku perkenalkan alat yang kubangun untuk mengatasinya 🚀\n\n#productivity #aitools #solodev`,
            visual_theme: "Neuro-Dark",
            technique: "Cognitive overload disruption",
            key_element: "Hook: context window otak sedang overflow.",
          },
          {
            act: "ACT_2_SOMATIC",
            headline: `Mengenalkan *${appName}*: *Asisten Kognitif Pintar*`,
            body_text: `${appName} dirancang khusus untuk ${solution}.\n\nCukup lempar ide mentah atau unek-unekmu, sistem otomatis memproses, mengelompokkan, dan mengeksekusi tanpa kamu harus pusing mikir alur teknisnya.`,
            call_to_action: "Lihat cara kerjanya yang instan.",
            caption: `Solusi terbaik dari ${appName} adalah kesederhanaannya.\n\nKamu tidak perlu mempelajari 100 fitur rumit. Cukup gunakan satu alur kerja untuk mengosongkan beban pikiran dan menyelesaikan tugas 5x lebih cepat.\n\n#software #automation #aipowered`,
            visual_theme: "Somatic-Clean",
            technique: "Solution presentation + cognitive relief",
            key_element: "Memperkenalkan solusi software pemecah masalah kognitif.",
          },
          {
            act: "ACT_3_CLINICAL_AI",
            headline: `Dari *3 jam pusing* menjadi *10 detik selesai*`,
            body_text: `Sebelum memakai ${appName}, tugas ini menghabiskan energi mental hingga sisa hari terasa terkuras. Sekarang, automasi cerdas yang menangani detail berulang, sehingga pikiranmu bebas fokus pada hal yang paling berdampak.`,
            call_to_action: "Waktumu terlalu berharga untuk tugas manual.",
            caption: `Efisiensi sejati bukan tentang kerja lebih keras, tetapi tentang membangun sistem yang bekerja untukmu saat kamu beristirahat.\n\n${appName} adalah bukti bagaimana AI bisa meringankan beban mental manusia secara nyata.\n\n#workflows #smarttools #productivityhacks`,
            visual_theme: "Hacker-Terminal",
            technique: "Contrast framing (sebelum vs sesudah)",
            key_element: "Perbandingan efisiensi nyata sebelum vs sesudah.",
          },
          {
            act: "ACT_4_ANCHOR",
            headline: `Akses khusus hari ini: *coba ${appName} sekarang*`,
            body_text: `Aku membuka akses khusus untuk teman-teman yang ingin mencoba versi terbaru ${appName} pekan ini.\n\nDapatkan template dan panduan instalasi langsung di chat WhatsApp.`,
            call_to_action: `KETIK '${input.persona.ctaKeyword}' untuk dapatkan akses`,
            caption: `Siap merasakan pikiran yang kembali enteng dan produktivitas yang melesat?\n\nAkses demo dan link khusus ${appName} siap aku kirimkan langsung.\n\nKetik '${input.persona.ctaKeyword}' sekarang di chat WhatsApp 📲\n\n#demo #download #aiassistant`,
            visual_theme: "Minimal-Hypnotic",
            technique: "Exclusive access CTA",
            key_element: "Akses eksklusif tools + CTA WhatsApp.",
          },
        ],
        lead_magnet_protocol: buildDefaultLeadMagnetProtocol(appName),
      };
    }
  }

  return {
    theme_topic: input.topic?.trim() ? words(input.topic.trim(), 10) : `Membaca sinyal tubuh: ${phrase}`,
    core_insight: "Tubuh melapor lebih dulu; pikiran mengikuti instruksi lama — tenangkan saraf, lalu refactor instruksinya.",
    acts: (Object.keys(TEMPLATES) as ActType[]).map((act) => buildOfflineAct(act, phrase, input.persona, seed)),
    lead_magnet_protocol: buildDefaultLeadMagnetProtocol(phrase),
  };
}
