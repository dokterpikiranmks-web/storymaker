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
    (t) => {
      const lower = t.toLowerCase();
      let symptom = "pikiran terasa padat dan tubuh mulai mengirim sinyal lelah";
      if (/lambung|maag|begah|gerd/.test(lower)) symptom = "perut mulai terasa begah dan asam lambung naik saat kepikiran";
      else if (/tidur|insomnia|lelap/.test(lower)) symptom = "mata lelah tapi pikiran justru berputar kencang tanpa henti";
      else if (/leher|bahu|kaku|pegal/.test(lower)) symptom = "otot leher belakang dan rahang bawah mengatup kaku";
      else if (/fokus|otak|mikir|hang/.test(lower)) symptom = "otak terasa nge-hang kebanyakan mikir hal yang belum terjadi";

      return {
        headline: `Saat kamu merasa *lelah dengan* ${t}`,
        body_text: `Perhatikan sinyal tubuh pagi ini: saat kamu mencoba tetap produktif, ${symptom}.\n\nTubuhmu tidak sedang rusak, ia hanya memberi sinyal butuh ruang istirahat sejenak. Siang nanti jam 12:30 ada teknik fisik sederhana peredanya.`,
        call_to_action: "Luangkan waktu 1 menit siang nanti jam 12:30.",
        caption: `Pagi ini mari jujur soal ${t}.\n\nYang sering kita anggap masalah pikiran atau mental, sebetulnya adalah alarm alami tubuh yang belum sempat kita dengarkan.\n\nSiang nanti jam 12:30 aku bagikan cara mudah merilisnya. Selamat beraktivitas 🌿\n\n#mindbody #kesehatantubuh #kesadaranpagi`,
        technique: "Empathetic pattern interrupt + morning body awareness",
        key_element: "Self-check pagi: mendengarkan alarm tubuh, tease tips siang 12:30.",
      };
    },
    (t) => ({
      headline: `Bukan dipaksa, tapi *didengarkan perlahan*`,
      body_text: `Soal ${t}: makin kita lawan dengan debat di kepala, tubuh justru makin tegang mengunci.\n\nSolusinya seringkali bukan mencari argumen baru, melainkan menenangkan sinyal tubuh fisik terlebih dahulu. Siang nanti ada panduan praktisnya.`,
      call_to_action: "Simak panduan fisiknya siang jam 12:30.",
      caption: `Pernah merasa makin dipikirkan, dada malah makin sesak dan kepala makin berat?\n\nItu bukti tubuhmu butuh istirahat dari mode siaga.\n\nSiang ini jam 12:30 kita bahas cara meredakannya secara fisik ✨\n\n#relaksasipagi #kesehatantubuh #kebijakandiri`,
      technique: "Mind-body somatic insight",
      key_element: "Kesadaran tubuh: tubuh merespons sebelum logika, panduan siang jam 12:30.",
    }),
  ],
  ACT_2_SOMATIC: [
    (t) => {
      const lower = t.toLowerCase();
      let verb1 = "TEKAN";
      let step1 = "Letakkan jempol di cekungan pangkal leher (GB-20) atau pergelangan tangan (PC-6) lembut 30 detik.";
      let herb = "Seduh rimpang jahe atau kunyit hangat 200ml tertutup 7 menit.";
      if (/lambung|maag|begah|gerd/.test(lower)) {
        verb1 = "SENTUH";
        step1 = "Tekan lembut titik PC-6 (3 jari di atas lipatan pergelangan tangan dalam) selama 40 detik.";
        herb = "Seduh kunyit parut + temulawak + sedikit madu dengan 200ml air hangat.";
      } else if (/tidur|insomnia/.test(lower)) {
        verb1 = "PIJAT";
        step1 = "Pijat lembut titik Shenmen HT-7 di lekukan pergelangan tangan sejajar kelingking.";
        herb = "Seduhan bunga telang / kamomil hangat dengan aroma pala.";
      }

      return {
        headline: `Lakukan ini 30 detik: *tubuh langsung enteng*`,
        body_text: `${verb1}: ${step1} Padukan dengan ${herb}\n\nPerhatikan bagaimana napasmu seketika lebih dalam dan rasa tegang perlahan luruh.`,
        call_to_action: "Coba praktikkan sekarang di mejamu.",
        caption: `Untuk meredakan ketegangan ${t}:\n\nCukup beri waktu 30 detik untuk tubuhmu. Titik akupresur dipadu seduhan alami hangat akan mengirim sinyal aman ke seluruh saraf.\n\nBagaimana pengalaman pasien dengan keluhan ini? Sore nanti jam 18:45 kita kupas ceritanya 🌿\n\n#titiksomatik #herbaldapur #relaksasikerja`,
        technique: "Actionable micro-somatic release + kitchen herbalism",
        key_element: "Teknik siang: titik akupresur terarah + seduhan herbal hangat, ajakan coba langsung.",
      };
    },
    () => ({
      headline: `Pola napas & seduhan: *rem alami tubuh*`,
      body_text:
        "Tarik napas lewat hidung 4 detik, lalu hembuskan panjang lewat mulut 8 detik seperti meniup lilin. Lengkapi dengan segelas air hangat rimpang tertutup.\n\nHembusan napas panjang adalah saklar alami tubuh untuk menurunkan denyut stres.",
      call_to_action: "Lakukan 3 kali siklus napas sekarang.",
      caption:
        "Saat otak mulai penuh di tengah hari, jangan debat dengan pikiran cemas.\n\nCukup perlambat hembusan napasmu dan minum air hangat. Biarkan rem alami tubuhmu bekerja memulihkan ketenangan 🍵\n\n#remalami #napaspanjang #kesehatanalami",
      technique: "Vagus nerve breathwork + thermal regulation",
      key_element: "Teknik siang: pernapasan buang panjang 4-8 + air hangat rimpang.",
    }),
  ],
  ACT_3_CLINICAL_AI: [
    (t) => ({
      headline: `Kisah meja terapi: *akar masalah ${t}*`,
      body_text: `Gejala Pasien: Keluhan ${t} berulang dan merasa lelah fisik berkepanjangan. -> Temuan Meja Terapi: Saraf bawah sadar terkunci di alarm siaga akibat pola instruksi lama. -> Hasil Pemulihan: Setelah titik saraf diselaraskan dan emosi dilepas, napas plong dan otot seketika relaks dalam 15 menit.`,
      call_to_action: "Tunggu refleksi malam nanti jam 21:00.",
      caption: `Banyak orang mengira ${t} hanya soal fisik semata.\n\nNamun di meja terapi, sering terungkap bahwa tubuh kita hanya sedang menjalankan perintah lama bawah sadar yang belum sempat di-update.\n\nNanti malam jam 21:00 ada panduan sebelum tidur untukmu 🌙\n\n#kisahterapi #akaralam #pemulihandiri`,
      technique: "Clinical social proof (Gejala -> Temuan -> Hasil)",
      key_element: "Kisah meja terapi: menghubungkan gejala fisik dengan instruksi emosi bawah sadar.",
    }),
    (t) => ({
      headline: `Yang dirasa fisik, *akarnya di bawah sadar*`,
      body_text: `Di meja terapi, kasus ${t} seringkali berakar dari ketegangan emosi yang dipendam bertahun-tahun. Tubuh yang dipaksa bertahan akhirnya mengunci sinyal tegang.\n\nKetika titik saraf dirilis dan pikiran diberi rasa aman, kesembuhan alami tubuh bekerja jauh lebih cepat.`,
      call_to_action: "Simak rangkuman malam ini jam 21:00.",
      caption: `Tubuh kita tidak pernah berbohong soal ${t}.\n\nApa yang kita tahan di hati dan kepala, tubuh yang menanggung bebannya. Meja terapi mengajarkan kita pentingnya memberi sinyal aman pada diri sendiri.\n\nMalam ini kita istirahatkan bersama ya 💤\n\n#bawahsadar #pemulihansaraf #kesehatansejati`,
      technique: "Human storytelling + mind-body connection",
      key_element: "Refleksi meja terapi: tubuh menanggung beban emosi, pentingnya rasa aman alami.",
    }),
  ],
  ACT_4_ANCHOR: [
    (t) => ({
      headline: `Malam ini, *izinkan tubuhmu* beristirahat`,
      body_text:
        `Hari ini kamu sudah berjuang luar biasa menghadapi ${t}. Malam ini sentuh dadamu, hembuskan napas panjang, dan lepaskan seluruh beban.\n\nCoba ceritakan di chat: bagian tubuh mana yang paling sering terasa kaku atau lelah hari ini?`,
      call_to_action: "Balas status ini untuk curhat santai",
      caption: `Tuntaskan hari ini dengan penuh kelembutan pada diri sendiri.\n\nKamu berhak atas tidur yang nyenyak dan pemulihan tubuh yang utuh 🌙\n\nCoba balas status ini: apa yang paling bikin tubuhmu tegang hari ini? Mari ngobrol santai ya 🙏\n\n#tidurnyenyak #afirmasimalam #pemulihandiri #dokterpikiran`,
      technique: "Restful anchoring + conversation starter",
      key_element: "Sugesti malam: afirmasi ketenangan dada, pelepasan beban, ajakan ramah membalas status chat WA.",
    }),
    (t) => ({
      headline: `Sentuh dadamu. *Hari ini sudah tuntas.*`,
      body_text:
        `Soal ${t} dan semua urusan hari ini: cukupkan sampai di sini. Biarkan sel-sel tubuhmu memperbaiki diri saat kamu tidur lelap malam ini.\n\nKamu tidak sendirian. Balas chat ini kapan saja kalau butuh teman bercerita.`,
      call_to_action: "Balas status ini jika butuh teman cerita",
      caption: `Sentuh dadamu dan bisikkan dalam hati: 'Hari ini sudah tuntas. Malam ini aku beristirahat damai.' 🤍\n\nKalau ada ganjalan di hati atau ketegangan fisik yang belum reda, pintu chat saya selalu terbuka untuk ngobrol santai.\n\nSelamat tidur lelap teman-teman ✨\n\n#tidurlelap #afirmasidiri #ketenanganmalam #dokterpikiran`,
      technique: "Heart-centered anchoring + empathetic connection",
      key_element: "Sugesti malam: sentuh dada, penyelesaian hari, ajakan chat ramah tanpa syarat.",
    }),
  ],
};

export function buildOfflineAct(act: ActType, topicPhrase: string, persona: PersonaSettings, seed: number): GeneratedAct {
  const variants = TEMPLATES[act];
  const builder = variants[(seed + ACTS[act].index) % variants.length];
  return { act, visual_theme: ACTS[act].defaultTheme, ...builder(topicPhrase, persona) };
}

export function buildDefaultLeadMagnetProtocol(topicPhrase: string): LeadMagnetProtocol {
  const upper = topicPhrase.toUpperCase();
  let keyword = "RESET";
  if (upper.includes("ENERGI") || upper.includes("LESU") || upper.includes("LELAH")) keyword = "ENERGI";
  else if (upper.includes("LAMBUNG") || upper.includes("BEGAH") || upper.includes("GERD") || upper.includes("MAAG")) keyword = "LAMBUNG";
  else if (upper.includes("POSTUR") || upper.includes("TULANG") || upper.includes("PUNGGUNG") || upper.includes("BAHU")) keyword = "POSTUR";
  else if (upper.includes("FOKUS") || upper.includes("MIKIR") || upper.includes("OTAK") || upper.includes("HANG")) keyword = "FOKUS";
  else if (upper.includes("TIDUR") || upper.includes("INSOMNIA") || upper.includes("LELAP")) keyword = "INSOMNIA";
  else if (upper.includes("TERAPI") || upper.includes("DETOKS")) keyword = "TERAPI";
  else if (upper.includes("LEHER") || upper.includes("BELIKAT")) keyword = "LEHER";
  else if (upper.includes("MIGRAIN") || upper.includes("KEPALA")) keyword = "MIGRAIN";

  let step1Title = "Titik Akupresur Somatik Terarah";
  let step1Action = "Tekan lembut titik meridian tubuh terkait selama 45–60 detik sambil bernapas perlahan.";
  let step1Mech = "Melancarkan sirkulasi energi meridian dan menenangkan sistem alarm tubuh.";

  let step2Title = "Formulasi Seduhan Herbal Dapur & Pola Napas";
  let step2Action = "Seduh rimpang alami hangat (200ml) tertutup 7 menit dipadu hembusan napas panjang.";
  let step2Mech = "Minyak atsiri alami meredakan radang dan mengaktifkan rem darurat saraf vagus.";

  if (keyword === "LAMBUNG") {
    step1Title = "Titik Akupresur PC-6 & CV-12 Ulu Hati";
    step1Action = "Tekan lembut titik 3 jari di atas lipatan pergelangan tangan dalam selama 60 detik.";
    step1Mech = "Menormalkan motilitas lambung dan menurunkan ketegangan gut-brain axis.";
    step2Title = "Seduhan Kunyit, Temulawak & Madu Hangat";
    step2Action = "Seduh irisan kunyit dan temulawak dengan 200ml air panas 80°C, tutup 7 menit, tambahkan madu murni.";
    step2Mech = "Kurkuminoid melapisi mukosa lambung dan meredakan peradangan asam lambung.";
  } else if (keyword === "INSOMNIA") {
    step1Title = "Titik Shenmen HT-7 Pergelangan Tangan";
    step1Action = "Pijat lembut titik lekukan pergelangan tangan sejajar jari kelingking selama 60 detik.";
    step1Mech = "Menstimulasi pelepasan neurotransmiter relaksasi alami dan menurunkan denyut jantung.";
    step2Title = "Seduhan Telang / Kamomil & Aroma Pala";
    step2Action = "Seduh bunga telang atau kamomil dengan air hangat, beri sejumput kecil bubuk pala sebelum tidur.";
    step2Mech = "Memicu aktivasi reseptor GABA alami untuk membawa otak ke frekuensi gelombang tidur pulih.";
  } else if (keyword === "FOKUS" || keyword === "ENERGI") {
    step1Title = "Titik Baihui GV-20 Puncak Kepala";
    step1Action = "Tekan lembut titik puncak kepala sejajar daun telinga selama 30 detik.";
    step1Mech = "Membuka sumbatan mikrosirkulasi darah ke korteks otak dan mengurai kabut pikiran.";
    step2Title = "Seduhan Jahe Hangat & Perasan Lemon";
    step2Action = "Seduh jahe geprek dengan 200ml air hangat, beri sedikit perasan lemon dan madu.";
    step2Mech = "Gingerol meningkatkan oksigenasi seluler dan menyegarkan energi tanpa lonjakan kafein berlebih.";
  }

  return {
    keyword,
    title: `Panduan Saku Pemulihan Mandiri & Protokol: ${topicPhrase}`,
    target_issue: `Membantu meredakan ketegangan fisik, mengurai stres, dan memulihkan vitalitas alami terkait ${topicPhrase}`,
    steps: [
      {
        step: 1,
        title: step1Title,
        action: step1Action,
        duration: "60 detik",
        mechanism: step1Mech,
      },
      {
        step: 2,
        title: step2Title,
        action: step2Action,
        duration: "60 detik",
        mechanism: step2Mech,
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
    pdf_summary: `Protokol ringkas 3 langkah praktis pemulihan mandiri untuk keluhan ${topicPhrase}. Panduan saku berbasis totok saraf akupresur, seduhan herbal dapur aman, dan relaksasi bawah sadar.`,
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
