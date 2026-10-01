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
        "Perhatikan pagi ini: saat pikiran bilang \"aku baik-baik saja\", bahu dan rahangmu justru mengeras. Tubuh selalu melapor lebih dulu.\n\nAda satu titik kecil yang bisa mematikan alarm itu dalam 90 detik. Aku buka siang nanti.",
      call_to_action: "Simpan rasa penasaranmu sampai 12:30.",
      caption: `Pagi ini aku mau jujur soal ${t}.\n\nYang kita kira masalah pikiran, seringkali adalah sinyal tubuh yang belum dibaca. Dan selama sinyal itu diabaikan, pikiran akan terus mencari masalah baru.\n\nSiang nanti aku bagikan teknik 90 detiknya. Pantau status berikutnya 🧠\n\n#hipnoterapi #totoksaraf #mentalhealth`,
      technique: "Open loop + paradoks tubuh-pikiran (efek Zeigarnik)",
      key_element: "Hook: tubuh melapor lebih dulu daripada pikiran.",
    }),
    (t) => ({
      headline: `Semakin keras *berpikir*, semakin jauh *jawabannya*`,
      body_text: `Ini paradoks yang sering aku lihat di ruang terapi soal ${t}. Otak yang dipaksa mencari solusi justru terkunci di mode bertahan hidup.\n\nKuncinya bukan di kepala. Ada di satu tempat di tubuhmu yang jarang kamu sentuh.`,
      call_to_action: "Tebak di mana? Jawabannya jam 12:30.",
      caption: `Pernah merasa makin dipikirkan, makin buntu? Itu bukan karena kamu kurang pintar.\n\nSaat otak masuk mode siaga, area berpikir jernih justru \"dimatikan\" sementara. Jalan keluarnya lewat tubuh, bukan lewat debat di kepala.\n\nSiang ini aku kasih tahu titiknya 👀\n\n#overthinking #hipnoterapi #selfhealing`,
      technique: "Pattern interrupt + curiosity gap",
      key_element: "Hook: solusi ada di tubuh, bukan di kepala.",
    }),
  ],
  ACT_2_SOMATIC: [
    () => ({
      headline: `*90 detik* untuk menenangkan *sistem saraf*`,
      body_text:
        "Letakkan dua jari di cekungan pangkal tengkorak, kiri dan kanan. Tekan lembut, tarik napas 4 hitungan, buang 8 hitungan. Ulangi 6 kali.\n\nNapas buang yang panjang mengirim sinyal aman lewat nervus vagus. Hentikan bila tidak nyaman.",
      call_to_action: "Coba sekarang, lalu rasakan bahumu.",
      caption:
        "Janji pagi tadi aku tepati 🙏\n\nTitik di pangkal tengkorak ini sering aku pakai di sesi totok saraf. Dikombinasikan dengan napas buang 2x lebih panjang, tubuh berpindah dari mode siaga (simpatik) ke mode pulih (parasimpatik).\n\nCoba sekarang dan ceritakan apa yang kamu rasakan.\n\n#totoksaraf #nervusvagus #breathwork",
      technique: "Somatic grounding + napas 4-8 (aktivasi parasimpatik)",
      key_element: "Teknik somatik: tekan lembut pangkal tengkorak + napas buang panjang.",
    }),
    (t) => ({
      headline: `Tubuh tenang dulu, *pikiran menyusul*`,
      body_text: `Untuk ${t}, mulai dari fisik: tekan lembut titik di antara ibu jari dan telunjuk 30 detik tiap tangan, sambil menghembuskan napas pelan seperti meniup lilin.\n\nDetak jantung melambat, otak pindah dari mode alarm ke mode jernih.`,
      call_to_action: "Praktikkan sekali sebelum makan siang.",
      caption:
        "Logikanya sederhana: pikiran yang panik tidak bisa diajak berdebat. Tapi tubuh bisa diajak melambat.\n\nTekanan lembut + napas buang panjang = sinyal ke otak bahwa kamu aman. Setelah itu, baru pikiran jernih bisa bekerja.\n\nSore nanti aku ceritakan kisah dari ruang terapi ✨\n\n#somatic #functionalmedicine #calm",
      technique: "Bottom-up regulation (tubuh → otak)",
      key_element: "Teknik somatik: titik tangan + napas buang pelan.",
    }),
  ],
  ACT_3_CLINICAL_AI: [
    (t) => ({
      headline: `Pikiranmu tidak *rusak*. *System prompt*-nya usang.`,
      body_text: `Seorang klien (disamarkan) datang dengan keluhan ${t}. Dia yakin dirinya "error".\n\nPadahal pikirannya hanya menjalankan instruksi lama dengan sangat disiplin. Persis AI agent: output buruk jarang karena modelnya bodoh, tapi karena instruksinya tak pernah di-update.`,
      call_to_action: "Instruksi lama apa yang masih kamu jalankan?",
      caption:
        "Siang aku ngoding AI agent, malam aku duduk di kursi terapi. Polanya ternyata sama.\n\nSaat agent memberi jawaban kacau, aku tidak memarahi modelnya — aku membaca ulang system prompt-nya. Di terapi pun begitu: kita cari \"instruksi lama\" yang masih dijalankan bawah sadar, lalu kita refactor.\n\nMalam ini ada sesi singkat untukmu 🌙\n\n#aiagent #hipnoterapi #mindset",
      technique: "Reframing + metafora terapeutik (analogi AI)",
      key_element: "Analogi AI: keyakinan lama = system prompt usang yang perlu di-refactor.",
    }),
    (t) => ({
      headline: `Di meja terapi, aku *debugging* manusia`,
      body_text: `Keluhannya ${t}. Kami tidak melawan gejalanya — kami menelusuri kode yang memicunya: satu keyakinan lama yang terus di-loop.\n\nSama seperti membangun AI agent: bug tidak hilang dengan marah pada output. Bug hilang saat baris akarnya ditemukan.`,
      call_to_action: "Malam ini kita refactor bersama.",
      caption:
        "Debugging manusia dan debugging kode punya aturan yang sama: jangan tambal gejalanya, temukan akar instruksinya.\n\nKlien ini (identitas disamarkan) akhirnya sadar, reaksinya bukan \"dirinya\" — hanya loop lama yang tidak pernah dihentikan.\n\nNanti malam aku pandu relaksasi singkat 💤\n\n#debugging #terapipikiran #aidev",
      technique: "Metafora debugging + dissociation ringan",
      key_element: "Analogi AI: gejala = output, keyakinan lama = bug di baris akar.",
    }),
  ],
  ACT_4_ANCHOR: [
    (_t, p) => ({
      headline: `Malam ini, biarkan *tubuhmu* yang memimpin`,
      body_text:
        "Pejamkan mata. Tarik napas pelan... dan saat menghembuskannya, biarkan hitungan mundur dari sepuluh membuat bahumu semakin ringan.\n\nKamu tidak perlu berusaha tenang. Cukup izinkan. Besok pagi kamu bangun dengan kepala yang lebih jernih.",
      call_to_action: `KETIK '${p.ctaKeyword}' untuk audio relaksasi 7 menit`,
      caption: `Sebelum tidur, beri tubuhmu izin untuk berhenti bekerja.\n\nSemakin kamu memperhatikan napasmu, semakin dalam rasa tenang itu turun... dan bagian dirimu yang paling bijak tahu cara melanjutkannya sendiri.\n\nMau versi audio terpandu? KETIK '${p.ctaKeyword}' di chat WhatsApp 🌙\n\n#relaksasi #hipnosis #tidurnyenyak`,
      technique: "Sugesti Alpha/Theta + future pacing + embedded command",
      key_element: "Sugesti malam: hitung mundur 10 → bahu melepas, bangun lebih jernih.",
    }),
    (_t, p) => ({
      headline: `Sentuh dadamu. *Ini anchor-mu* malam ini.`,
      body_text:
        "Letakkan telapak tangan di dada, rasakan hangatnya. Setiap napas keluar membawa pergi sisa hari ini.\n\nMulai malam ini, setiap kali kamu menyentuh dada seperti ini, tubuhmu ingat rasa aman ini... semakin dalam, semakin tenang.",
      call_to_action: `KETIK '${p.ctaKeyword}' untuk panduan lengkapnya`,
      caption: `Anchor adalah jembatan kecil ke rasa aman yang bisa kamu bawa ke mana saja.\n\nMalam ini kita tanam bersama: telapak tangan di dada, napas buang panjang, izinkan tubuh melepas. Besok, saat hari mulai berat, cukup sentuh dada dan rasakan kembali.\n\nKETIK '${p.ctaKeyword}' kalau mau panduan audionya 🤍\n\n#anchoring #hipnoterapi #selfcare`,
      technique: "Kinesthetic anchoring + presuposisi",
      key_element: "Sugesti malam: sentuhan dada sebagai anchor rasa aman.",
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
    title: `Protokol 3 Menit Reset Somatik: ${topicPhrase}`,
    target_issue: `Meredakan ketegangan sistem saraf, leher kaku, dan overthinking terkait ${topicPhrase}`,
    steps: [
      {
        step: 1,
        title: "Pelepasan Titik Meridian GB-20 (Fengchi)",
        action: "Letakkan kedua jempol tangan di lekukan pangkal tengkorak belakang leher. Berikan tekanan lembut mengarah ke atas selama 60 detik sambil menutup mata.",
        duration: "60 detik",
        mechanism: "Mengendurkan spasme otot suboksipital, melancarkan aliran darah ke otak, dan mengirim sinyal relaksasi ke nervus vagus.",
      },
      {
        step: 2,
        title: "Regulasi Saraf Vagus via Extended Exhale 4-8",
        action: "Tarik napas perlahan melalui hidung selama 4 detik, lalu hembuskan lembut lewat bibir mengerucut selama 8 detik. Ulangi sebanyak 5 siklus.",
        duration: "60 detik",
        mechanism: "Hembusan napas yang panjang menurunkan denyut jantung dan memicu pelepasan asetilkolin untuk mengaktifkan sistem saraf parasimpatik.",
      },
      {
        step: 3,
        title: "Subconscious Anchoring & Pelepasan",
        action: "Sentuh telapak tangan kanan di dada tengah, rasakan sensasi hangat napasmu, dan afirmasikan dalam hati: 'Tubuhku aman, instruksi lama telah selesai dilepas.'",
        duration: "60 detik",
        mechanism: "Menanamkan jangkar kinestetik (kinesthetic anchor) pada frekuensi gelombang otak Alpha untuk mengunci rasa tenang di memori somatik.",
      },
    ],
    pdf_summary: `Protokol klinis 3 langkah mandiri untuk memutus loop stres, mengaktifkan saraf vagus, dan merestorasi ketenangan pikiran dalam waktu kurang dari 3 menit.`,
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
