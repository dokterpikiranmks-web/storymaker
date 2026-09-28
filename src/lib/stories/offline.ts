import { ACTS, type ActType } from "./constants";
import type { GeneratedAct, GeneratedStory, PersonaSettings } from "./types";
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

export function generateOfflineStory(input: { topic?: string; rawThought?: string; persona: PersonaSettings }): GeneratedStory {
  const phrase = deriveTopicPhrase(input.topic, input.rawThought);
  const seed = hashString(`${input.topic ?? ""}|${input.rawThought ?? ""}`);
  return {
    theme_topic: input.topic?.trim() ? words(input.topic.trim(), 10) : `Membaca sinyal tubuh: ${phrase}`,
    core_insight: "Tubuh melapor lebih dulu; pikiran mengikuti instruksi lama — tenangkan saraf, lalu refactor instruksinya.",
    acts: (Object.keys(TEMPLATES) as ActType[]).map((act) => buildOfflineAct(act, phrase, input.persona, seed)),
  };
}
