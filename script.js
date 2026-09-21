const menuBtn = document.getElementById("menuBtn");
const navlinks = document.getElementById("navlinks");
menuBtn.addEventListener("click", () => {
  const isOpen = navlinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", isOpen);
});

function showSection(id) {
  document.querySelectorAll(".page-section").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });
  const target = document.getElementById(id);
  target.classList.add("active");
  target.style.display = "block";
  navlinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", false);
  window.scrollTo(0, 0);
}

// Persisted in sessionStorage so a refresh or tab-switch on unstable
// mobile data doesn't wipe the student's active code mid-module.
// Clears automatically when the browser tab is closed.
let studentCode = sessionStorage.getItem("aiwise_code") || null;
const codeGate = document.getElementById("codeGate");
const codeInput = document.getElementById("codeInput");
const codeError = document.getElementById("codeError");
const codeStatus = document.getElementById("codeStatus");

if (studentCode) {
  codeGate.classList.add("hidden");
  codeStatus.textContent = `Signed in as ${studentCode}.`;
}

document.getElementById("codeSubmit").addEventListener("click", submitCode);
codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitCode(); });

function submitCode() {
  const val = codeInput.value.trim();
  if (!val) { codeError.classList.add("show"); return; }
  studentCode = val;
  sessionStorage.setItem("aiwise_code", val);
  codeGate.classList.add("hidden");
  codeStatus.textContent = `Signed in as ${studentCode}.`;
}

// Each form needs its own "Anonymous code" short-answer field.
// Get each pre-filled link via: Forms editor → ⋮ menu → Pre-fill form
// → fill the code field with a placeholder → Get link.
const FORMS = {
  "pretest":        { base: "https://docs.google.com/forms/d/e/1FAIpQLSdXOheGt5fNaC12ytptEewsPevylr3RoZ3shiMX6CI1GwTUQA/viewform", codeField: "entry.85276607" },
  "posttest":       { base: "https://docs.google.com/forms/d/e/1FAIpQLSdK1370iWGHwHEi9IcD9rj1HmccCOMO8K_IMmITAXi_mM9-dw/viewform", codeField: "entry.201168166" },
  "consent":        { base: "https://docs.google.com/forms/d/e/1FAIpQLScQSuaX5MCqhWJslpn3tMNrZIXYVi1hDyH1KCdwjlg1cTpqvQ/viewform", codeField: "entry.1342886080" },
  "responsibleUse": { base: "https://docs.google.com/forms/d/e/1FAIpQLScMrxM3TrUbY6FQj5oHnpGN_w7CBAKCEbEV2LDgt-k-CWetJg/viewform", codeField: "entry.1334380107" },
  "usability":      { base: "https://docs.google.com/forms/d/e/1FAIpQLSeI-S6aGfIqFN3RvwX4U6XOqVzL3SDaotIr95QJmUOURPWQUQ/viewform", codeField: "entry.1341090640" },
};

function goToForm(key) {
  if (!studentCode) {
    alert("Please enter your anonymous code first.");
    codeGate.classList.remove("hidden");
    return;
  }
  const form = FORMS[key];
  if (!form) { console.error("Unknown form key:", key); return; }
  const url = `${form.base}?usp=pp_url&${form.codeField}=${encodeURIComponent(studentCode)}`;
  window.open(url, "_blank");
}

document.getElementById("saveRulesBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("saveStatus");
  if (!studentCode) {
    alert("Please enter your anonymous code first.");
    codeGate.classList.remove("hidden");
    return;
  }
  const rulesText = document.getElementById("rulesInput").value.trim();
  if (!rulesText) {
    statusEl.textContent = "Write at least one rule before saving.";
    statusEl.className = "save-status err";
    return;
  }
  statusEl.textContent = "Saving...";
  statusEl.className = "save-status";
  if (typeof window.saveAIRulesToFirebase !== "function") {
    statusEl.textContent = "Still loading — please wait a second and press Save again.";
    statusEl.className = "save-status err";
    return;
  }
  try {
    await window.saveAIRulesToFirebase(studentCode, rulesText);
    statusEl.textContent = "Saved. You can update this anytime before the posttest.";
    statusEl.className = "save-status ok";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save right now — check your connection and try again.";
    statusEl.className = "save-status err";
  }
});

// ---- Help Assistant: scripted FAQ, no API, no external AI model ----
// Every answer below paraphrases content that already exists elsewhere on
// this site (the modules, the code-gate, My AI Rules, the appendix-style
// procedure). It never generates new claims — if nothing matches well
// enough, it says so and points to the instructor instead of guessing.
const helpFAQ = [
  { keys: ["paano gumagana ang code", "anong ginagawa ng code", "ano ang anonymous code", "para saan ang code", "gumagana ang anonymous"],
    a: "Ang anonymous code mo ay hindi login o password, isang matching identifier ito na nagdurugtong sa lahat ng sagot mong Google Form (pretest, posttest, Responsible Use Scenarios, Usability Evaluation) at sa iyong My AI Rules entries sa Firebase, nang hindi ginagamit ang pangalan mo. Ibinigay ito sa iyo noong pumirma ka ng consent form, kaya huwag itong baguhin o gawan ng sariling version." },
  { keys: ["help assistant", "bubble chat", "chat bubble", "paano gumamit ng help", "ano ang chat na ito", "ano itong chat", "chat guide"],
    a: "Ang help bubble na ito ay simpleng FAQ assistant lang, hindi totoong AI chatbot. Kino-keyword match lang nito ang tanong mo sa mga paksang nasa AIwise mismo (mga module, code, My AI Rules, atbp.) at sumasagot base dito. Kapag walang tumugmang paksa, sasabihin nito nang diretso at ire-refer ka sa instructor at hindi ito gagawa ng bagong sagot na wala sa site." },
  { keys: ["sign in", "mag-sign in", "paano mag", "log in", "gumamit ng code"],
    a: "I-type mo lang ang eksaktong anonymous code na ibinigay sa iyo sa consent form, tapos pindutin ang Continue. Hindi ito login o password, matching identifier lang ito para maiugnay ang iyong pretest, posttest, Responsible Use Scenarios, My AI Rules, at Usability Evaluation nang hindi gamit ang pangalan mo." },
  { keys: ["nakalimutan", "forgot", "lost my code", "wala akong code", "nawala"],
    a: "Kung nakalimutan mo ang iyong anonymous code, hindi ito ma-rerecover dito sa site mismo, walang account system na nakaka-reset nito. Sabihin sa iyong researcher/instructor para makuha ulit ang code na ibinigay sa iyo sa consent form." },
  { keys: ["decision tree", "gagamit ba ako", "pwede ba gumamit", "allowed ba", "payag ba"],
    a: "Tingnan ang AI Use Decision Tree sa Module 2 (Responsible Use). Apat na tanong ang gabay: (1) pinapayagan ba ito ng instructor, (2) ano ang gagamitin mo sa AI, (3) kaya mo bang i-verify o ipaliwanag ang output, at (4) kailangan bang idisclose. Dalawa o higit na 'red flag' = kumonsulta muna sa instructor." },
  { keys: ["hallucination", "totoo ba", "paano malalaman kung mali", "mali ba"],
    a: "Ang AI hallucination ay kapag gumawa ang AI ng impormasyong mali o hindi totoo pero mukhang kumpiyansa, at tinatalakay ito sa Module 3 (Fact-Check) kasama ang tatlong halimbawa (maling historical claim, gawa-gawang citation, at maling security advice). Palaging i-cross-check sa credible source bago mo gamitin." },
  { keys: ["privacy", "safe ba", "datos", "impormasyon", "personal na detalye"],
    a: "Tingnan ang Module 4 (Privacy). Maaaring ma-store at ma-review ng kumpanya ang mga isinusulat mo sa isang AI chatbot, kaya iwasan ang pagtype ng personal na detalye. Iba-iba rin ang patakaran ng bawat service, kaya tingnan ang kasalukuyang privacy policy ng partikular na ginagamit mong AI." },
  { keys: ["my ai rules", "i-save", "save my rules", "paano gawin ang rules"],
    a: "Sa My AI Rules tool, isulat mo ang sarili mong gabay sa paggamit ng AI, tapos pindutin ang Save. Naka-log ang bawat pag-save bilang bagong entry (hindi na-o-overwrite), kaya makikita ang una mong bersyon at ang binago mo bago ang posttest." },
  { keys: ["ai tools", "aling ai", "recommend", "tool na gagamitin", "anong ai"],
    a: "Puntahan ang AI Tools directory, nakagrupo ito by category (Writing/Research, Coding, Productivity, Creative, Career/Business) na may maikling best-for at pag-iingat bawat isa. Palaging i-check ang current documentation ng provider dahil mabilis magbago ang features nila." },
  { keys: ["form a", "form b", "pretest", "posttest", "test", "quiz"],
    a: "Form A ang ginagamit sa pretest (Week 1) at Form B naman sa posttest (Week 4), magkaiba ang senaryo pero pareho ang tinitignan na competencies, para hindi lang basta pag-alala sa sagot ang masusukat." },
  { keys: ["usability", "evaluation", "feedback sa site", "ano sa site"],
    a: "May Usability Evaluation na sasagutan mo sa Week 4, pagkatapos ng posttest, tungkol ito sa kadalian ng navigation, pagkabasa, Taglish clarity, bilis ng loading, at kung gaano ka-useful ang mga module." },
  { keys: ["mabagal", "slow", "internet", "loading", "connection", "walang net"],
    a: "Dinisenyo ang AIwise para gumana kahit mabagal ang mobile data at walang malalaking larawan o video sa mga module. Kung nag-refresh ka, hindi ka mawawala sa session, naaalala pa rin ng site ang code mo habang bukas ang tab." },
  { keys: ["responsible use", "paggamit ng ai", "etikal", "tamang gamit"],
    a: "Tingnan ang Module 2 (Responsible Use) para sa mga halimbawa ng tama at maling paggamit ng AI sa academic settings, kasama ang AI Use Decision Tree." },
  { keys: ["fact check", "paano i-verify", "verify", "i-check"],
    a: "Tingnan ang Module 3 (Fact-Check) dito mo mapapraktis ang pagtukoy ng mga senaryo kung saan mali o gawa-gawa lang ang sagot ng AI, at paano ito i-verify." },
  { keys: ["interview", "tatanungin", "kausapin", "usap"],
    a: "May maikling interview sa Week 4 na may tatlong open-ended na tanong tungkol sa karanasan mo gamit ang mga module, walang tamang o maling sagot dito." },
  { keys: ["baguhin", "i-edit", "pwede ko bang palitan", "revise", "ulitin ang rules"],
    a: "Oo, pwede mong baguhin ang My AI Rules mo anumang oras bago ang posttest. Naka-log ang bawat pag-save bilang bagong entry, kaya makikita pa rin ang una mong bersyon kasama ang binago mo." },
  { keys: ["kontak", "contact", "sino ang tatanungin", "may problema", "tulong"],
    a: "Kung may problema ka o katanungan tungkol sa study, tingnan ang About page ng AIwise para sa contact details ng researcher." },
  { keys: ["gray area", "grey area", "hindi malinaw", "malabo"],
    a: "Sa Module 2 (Responsible Use), tinutukoy ng 'gray area' ang agwat sa pagitan ng 'ginamit ko lang as tulong' at 'AI na mismo ang gumawa nito.' Halos lahat ng gray area ay napupunta sa tatlong sitwasyon: (1) brainstorming/outline vs. buong sanaysay, (2) grammar check vs. code na hindi mo ginawa, at (3) pag-unawa vs. word-for-word na pag-copy. Ang tanong na dapat mong sagutin sa sarili: kung tatanungin ka kung paano mo ginawa 'to, may masasabi ka ba nang hindi nagsu-stutter?" },
];

// All 15 chip-worthy questions, each mapped to a topic already covered in
// helpFAQ above. All are shown at once inside a scrollable strip (see
// .help-chips max-height + overflow-y in the CSS) so the panel itself
// never grows or pushes the answer log down, regardless of how many
// questions are listed.
const helpChipPool = [
  "Paano gumagana ang anonymous code?",
  "Paano gamitin ang chat bubble na ito?",
  "Paano mag-sign in?",
  "Nakalimutan ko ang code ko",
  "Ano ang Decision Tree?",
  "Ano ang AI hallucination?",
  "Safe ba ang datos ko sa AI?",
  "Paano mag-save ng My AI Rules?",
  "Anong AI tool ang gagamitin ko?",
  "Ano ang Form A at Form B?",
  "Ano ang Usability Evaluation?",
  "Mabagal ang internet ko, okay lang ba?",
  "Ano ang dapat tandaan sa Responsible Use?",
  "Paano gumagana ang Fact-Check module?",
  "Ano ang mangyayari sa interview sa Week 4?",
  "Pwede ko bang baguhin ang My AI Rules ko?",
  "Sino ang makokontak ko kung may problema?",
  "Ano ang ibig sabihin ng gray area sa modules?"
];

function renderHelpChips() {
  const container = document.getElementById("helpChips");
  container.innerHTML = "";
  helpChipPool.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "help-chip";
    btn.textContent = q;
    btn.onclick = () => askHelp(q);
    container.appendChild(btn);
  });
}
renderHelpChips();

function toggleHelp() {
  document.getElementById("helpPanel").classList.toggle("hidden");
}

function matchHelp(question) {
  const q = question.toLowerCase();
  let best = null, bestScore = 0;
  for (const entry of helpFAQ) {
    const score = entry.keys.reduce((n, k) => n + (q.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.a;
  return "Wala akong direktang sagot dito na tugma sa tanong mo. Subukan mong tingnan ang kaugnay na module (Home page may listahan), o itanong nang direkta sa iyong instructor/researcher, ito kasi ay simpleng guide lamang batay sa nilalaman ng site, at hindi totoong AI.";
}

function askHelp(preset) {
  const input = document.getElementById("helpInput");
  const question = (preset !== undefined ? preset : input.value).trim();
  if (!question) return;
  const log = document.getElementById("helpLog");
  const userMsg = document.createElement("div");
  userMsg.className = "help-msg user";
  userMsg.textContent = question;
  log.appendChild(userMsg);
  const botMsg = document.createElement("div");
  botMsg.className = "help-msg bot";
  botMsg.textContent = matchHelp(question);
  log.appendChild(botMsg);
  log.scrollTop = log.scrollHeight;
  if (preset === undefined) input.value = "";
}
