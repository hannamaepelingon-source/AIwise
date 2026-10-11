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
  renderProgress();
  if (id === "home") { renderHome(); autoOpenStep(); }
  if (id === "ai-rules") restoreRules();
}

// Persisted in sessionStorage so a refresh or tab-switch on unstable
// mobile data doesn't wipe the student's active code mid-module.
// Clears automatically when the browser tab is closed.
// Only the researcher-issued codes AIWISE-01 to AIWISE-20 are accepted. The check
// runs locally in the browser (no network call), and the code is trimmed and
// uppercased first, so "aiwise-07" works but "AIWISE-7" or "AIWISE 07" do not.
// This prevents typo codes from creating stray records. It is not security:
// the list is visible in the page source. Change CODE_COUNT if the sample grows.
const CODE_COUNT = 20;
const VALID_CODES = Array.from({ length: CODE_COUNT }, (_, i) => "AIWISE-" + String(i + 1).padStart(2, "0"));
const CODE_PATTERN = { test: (c) => VALID_CODES.includes(c) };
function normalizeCode(raw) { return (raw || "").trim().toUpperCase(); }

let studentCode = normalizeCode(sessionStorage.getItem("aiwise_code")) || null;
if (studentCode && !CODE_PATTERN.test(studentCode)) { studentCode = null; sessionStorage.removeItem("aiwise_code"); }
const codeGate = document.getElementById("codeGate");
const codeInput = document.getElementById("codeInput");
const codeError = document.getElementById("codeError");

if (studentCode) {
  codeGate.classList.add("hidden");
}

document.getElementById("codeSubmit").addEventListener("click", submitCode);
codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitCode(); });

function submitCode() {
  const val = normalizeCode(codeInput.value);
  if (!val) {
    codeError.textContent = "Ilagay ang code mo para magpatuloy.";
    codeError.classList.add("show");
    return;
  }
  if (!CODE_PATTERN.test(val)) {
    codeError.textContent = "Hindi valid ang code. Tingnan ang code na ibinigay sa iyo (hal. AIWISE-07).";
    codeError.classList.add("show");
    return;
  }
  codeError.classList.remove("show");
  codeInput.value = val;
  studentCode = val;
  sessionStorage.setItem("aiwise_code", val);
  renderProgress();
  restoreRules();
  codeGate.classList.add("hidden");
  renderHome();
  autoOpenStep();
}

// ---- Module completion tracker (visual only) ----
// Stored in localStorage on this device only, keyed by the anonymous code,
// so no server call is needed and a shared computer does not mix students up.
// This is not research data; it only drives the progress bars and badges.
function progressKey() { return "aiwise_done_" + (studentCode || "guest"); }

function getDone() {
  try {
    const raw = localStorage.getItem(progressKey());
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }   // storage blocked or corrupted: treat as nothing done
}

function markDone(n) {
  const done = getDone();
  if (!done.includes(n)) {
    done.push(n);
    try { localStorage.setItem(progressKey(), JSON.stringify(done)); } catch (e) { /* ignore */ }
  }
  renderProgress();
}

function renderProgress() {
  const done = getDone();
  document.querySelectorAll(".module-progress").forEach(bar => {
    const current = Number(bar.dataset.current);
    bar.querySelectorAll("span").forEach((sp, i) => {
      const num = i + 1;
      sp.classList.toggle("done", done.includes(num));
      sp.classList.toggle("current", !done.includes(num) && num === current);
    });
    bar.setAttribute("aria-label", done.length + " of 4 modules completed");
  });
  document.querySelectorAll("[data-badge]").forEach(b => {
    const isDone = done.includes(Number(b.dataset.badge));
    b.textContent = isDone ? "\u2713 Done" : "";
    b.classList.toggle("show", isDone);
  });
  const w4Note = document.getElementById("week4Note");
  const w4Group = document.getElementById("week4Group");
  const metaW23 = document.getElementById("metaW23");
  const metaW4 = document.getElementById("metaW4");
  const all = done.length === 4;
  if (w4Note && w4Group) {
    w4Note.textContent = all ? "Natapos mo na ang lahat ng 4 modules. Handa ka na para sa Week 4 kapag sinabi ng researcher." : "";
    w4Group.classList.toggle("ready", all);
  }
  if (metaW23) metaW23.textContent = done.length + " of 4 modules";
  if (metaW4) metaW4.textContent = all ? "Ready" : "4 steps";
  renderHome();
  const summary = document.getElementById("progressSummary");
  if (summary) {
    summary.textContent = done.length === 4
      ? "All 4 modules completed. You can now write your My AI Rules."
      : done.length + " of 4 modules completed";
  }
}

// responsibleUseWeek1 = baseline survey (Week 1, with the pretest).
// responsibleUseWeek4 = same survey repeated (Week 4, with the posttest).
// The consent form is now a signed hardcopy, so it has no entry here.
// Each form needs its own "Anonymous code" short-answer field.
// Get each pre-filled link via: Forms editor → ⋮ menu → Pre-fill form
// → fill the code field with a placeholder → Get link.
const FORMS = {
  "pretest":        { base: "https://docs.google.com/forms/d/e/1FAIpQLSdXOheGt5fNaC12ytptEewsPevylr3RoZ3shiMX6CI1GwTUQA/viewform", codeField: "entry.85276607" },
  "posttest":       { base: "https://docs.google.com/forms/d/e/1FAIpQLSdK1370iWGHwHEi9IcD9rj1HmccCOMO8K_IMmITAXi_mM9-dw/viewform", codeField: "entry.201168166" },
  "responsibleUseWeek4": { base: "https://docs.google.com/forms/d/e/1FAIpQLScQSuaX5MCqhWJslpn3tMNrZIXYVi1hDyH1KCdwjlg1cTpqvQ/viewform", codeField: "entry.1342886080" },
  "responsibleUseWeek1": { base: "https://docs.google.com/forms/d/e/1FAIpQLScMrxM3TrUbY6FQj5oHnpGN_w7CBAKCEbEV2LDgt-k-CWetJg/viewform", codeField: "entry.1334380107" },
  "usability":      { base: "https://docs.google.com/forms/d/e/1FAIpQLSeI-S6aGfIqFN3RvwX4U6XOqVzL3SDaotIr95QJmUOURPWQUQ/viewform", codeField: "entry.1341090640" },
};

// ---- Home: compact signed-in header and collapsible Week rows ----
// Everything here is local to the browser; it only changes what Home shows.
function smoothBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function openStep(id, scroll) {
  document.querySelectorAll(".step-row").forEach(d => { d.open = (d.id === id); });
  if (scroll) document.getElementById(id).scrollIntoView({ behavior: smoothBehavior(), block: "start" });
}

// Open the row that matches the student's progress: no module finished -> Week 1,
// some finished -> Weeks 2-3, all four finished -> Week 4. The student can still
// open any row, because the site cannot know which week the researcher is running.
function autoOpenStep() {
  const n = getDone().length;
  openStep(n === 0 ? "step-w1" : (n < 4 ? "step-w23" : "week4Group"), false);
}

// Only one row open at a time.
document.querySelectorAll(".step-row").forEach(d => {
  d.addEventListener("toggle", () => {
    if (d.open) document.querySelectorAll(".step-row").forEach(o => { if (o !== d) o.open = false; });
  });
});

// Shows "Signed in as ..." in the short line under the hero.
function renderHome() {
  const status = document.getElementById("codeStatus");
  if (status) status.textContent = studentCode ? "Signed in as " + studentCode + "." : "";
}

function openAbout(anchorId) {
  showSection("about");
  const el = document.getElementById(anchorId);
  if (el) el.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
}

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
    try { localStorage.setItem(rulesKey(), rulesText); } catch (e) { /* storage blocked: the Firebase save still succeeded */ }
    statusEl.textContent = "Saved. You can update this anytime before the posttest.";
    statusEl.className = "save-status ok";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save right now — check your connection and try again.";
    statusEl.className = "save-status err";
  }
});

// ---- Restore last saved rules (convenience only) ----
// The research record is the Firebase log. This local copy just refills the
// box on the same device and browser so students can revise instead of
// retyping. It is keyed by the anonymous code and never overwrites typing.
function rulesKey() { return "aiwise_rules_" + (studentCode || "guest"); }

function restoreRules() {
  const box = document.getElementById("rulesInput");
  const note = document.getElementById("restoreNote");
  if (!box || !note || !studentCode || box.value.trim()) return;
  try {
    const saved = localStorage.getItem(rulesKey());
    if (saved) {
      box.value = saved;
      note.textContent = "Na-load ang huling na-save mong rules mula sa device na ito. I-edit ito at i-save ulit para sa bagong entry.";
    }
  } catch (e) { /* storage blocked: start with an empty box */ }
}

// ---- Help Assistant: scripted FAQ, no API, no external AI model ----
// Every answer below paraphrases content that already exists elsewhere on
// this site (the modules, the code-gate, My AI Rules, the appendix-style
// procedure). It never generates new claims — if nothing matches well
// enough, it says so and points to the instructor instead of guessing.
const helpFAQ = [
  { id: "steps", q: "Ano ang gagawin ko sa Week 1 at Week 4?", follow: ["forms", "progress"],
    keys: ["responsible use survey", "survey", "week 1", "week 4", "anong gagawin", "kailan ko sasagutan"],
    a: "Sa Home page, pindutin ang 'Open Week 1 steps' o tingnan ang 'Study steps' — bubukas doon ang Week 1, Weeks 2–3, o Week 4 depende sa progress mo. Sa Week 1, sagutan ang pretest (Form A) at ang Responsible Use Survey bago ang mga module. Sa Week 4, sagutan ang posttest (Form B), ang parehong Responsible Use Survey ulit, at ang Usability Evaluation, kasama ang pag-revise ng My AI Rules mo. Pareho ang tanong ng survey sa Week 1 at Week 4 para makita kung may nagbago. Gamitin ang parehong anonymous code sa lahat." },
  { id: "code", q: "Paano gumagana ang anonymous code?", follow: ["signin", "forgot"],
    keys: ["paano gumagana ang code", "anong ginagawa ng code", "ano ang anonymous code", "para saan ang code", "gumagana ang anonymous"],
    a: "Ang anonymous code mo ay hindi login o password — isang matching identifier ito na nagdurugtong sa lahat ng sagot mong Google Form (pretest, posttest, Responsible Use Survey, Usability Evaluation) at sa iyong My AI Rules entries sa Firebase, nang hindi ginagamit ang pangalan mo. Ibinigay ito sa iyo ng researcher (AIWISE-01 hanggang AIWISE-20), kaya huwag itong baguhin o gawan ng sariling version." },
  { id: "helpbot", q: "Paano gamitin ang chat bubble na ito?", follow: ["steps", "contact"],
    keys: ["help assistant", "bubble chat", "chat bubble", "paano gumamit ng help", "ano ang chat na ito", "ano itong chat", "chat guide"],
    a: "Ang help bubble na ito ay simpleng FAQ assistant lang, hindi totoong AI chatbot. Pumili ka lang ng paksa, tapos ng tanong, at lalabas ang sagot — hindi mo kailangang mag-type. Opsyonal ang text box: kino-keyword match lang nito ang tanong mo sa mga paksang nasa AIwise mismo (mga module, code, My AI Rules, atbp.). Kapag walang tumugma, sasabihin nito nang diretso at ire-refer ka sa instructor, at may button na 'Hindi ko makita ang tanong ko' na magbubukas ng contact ng researcher sa About page. Hindi ito gagawa ng bagong sagot na wala sa site." },
  { id: "signin", q: "Paano mag-sign in?", follow: ["code", "forgot"],
    keys: ["sign in", "mag-sign in", "paano mag", "log in", "gumamit ng code"],
    a: "I-type mo lang ang eksaktong code na ibinigay sa iyo (AIWISE-01 hanggang AIWISE-20), tapos pindutin ang Continue. Hindi mahalaga kung malaki o maliit ang letra, pero dapat tama ang bawat karakter, kasama ang 0 sa unahan (hal. AIWISE-07, hindi AIWISE-7). Kapag \"Hindi valid ang code\" ang lumabas, tingnan ulit ang code o magtanong sa researcher. Hindi ito login o password — matching identifier lang ito para maiugnay ang iyong pretest, posttest, Responsible Use Survey, My AI Rules, at Usability Evaluation nang hindi gamit ang pangalan mo." },
  { id: "forgot", q: "Nakalimutan ko ang code ko", follow: ["contact", "signin"],
    keys: ["nakalimutan", "forgot", "lost my code", "wala akong code", "nawala"],
    a: "Kung nakalimutan mo ang iyong anonymous code, hindi ito ma-rerecover dito sa site mismo — walang account system na nakaka-reset nito. Sabihin sa iyong researcher/instructor para makuha ulit ang code na ibinigay sa iyo." },
  { id: "tree", q: "Ano ang Decision Tree?", follow: ["gray", "resp"],
    keys: ["decision tree", "gagamit ba ako", "pwede ba gumamit", "allowed ba", "payag ba"],
    a: "Tingnan ang AI Use Decision Tree sa Module 2 (Responsible Use). Apat na tanong ang gabay: (1) pinapayagan ba ito ng instructor, (2) ano ang gagamitin mo sa AI, (3) kaya mo bang i-verify o ipaliwanag ang output, at (4) kailangan bang idisclose. Dalawa o higit na 'red flag' = kumonsulta muna sa instructor." },
  { id: "halluc", q: "Ano ang AI hallucination?", follow: ["factcheck", "privacy"],
    keys: ["hallucination", "totoo ba", "paano malalaman kung mali", "mali ba"],
    a: "Ang AI hallucination ay kapag gumawa ang AI ng impormasyong mali o hindi totoo pero mukhang kumpiyansa — tinatalakay ito sa Module 3 (Fact-Check) kasama ang tatlong halimbawa (maling historical claim, gawa-gawang citation, at maling security advice). Palaging i-cross-check sa credible source bago mo gamitin." },
  { id: "privacy", q: "Safe ba ang datos ko sa AI?", follow: ["sitedata", "rules"],
    keys: ["privacy", "safe ba", "datos", "impormasyon", "personal na detalye"],
    a: "Tingnan ang Module 4 (Privacy). Maaaring ma-store at ma-review ng kumpanya ang mga isinusulat mo sa isang AI chatbot, kaya iwasan ang pagtype ng personal na detalye. Iba-iba rin ang patakaran ng bawat service, kaya tingnan ang kasalukuyang privacy policy ng partikular na ginagamit mong AI." },
  { id: "rules", q: "Paano mag-save ng My AI Rules?", follow: ["edit", "sitedata"],
    keys: ["my ai rules", "i-save", "save my rules", "paano gawin ang rules"],
    a: "Sa My AI Rules tool, isulat mo ang sarili mong gabay sa paggamit ng AI, tapos pindutin ang Save. Naka-log ang bawat pag-save bilang bagong entry (hindi na-o-overwrite), kaya makikita ang una mong bersyon at ang binago mo bago ang posttest." },
  { id: "tools", q: "Anong AI tool ang gagamitin ko?", follow: ["resp", "halluc"],
    keys: ["ai tools", "aling ai", "recommend", "tool na gagamitin", "anong ai"],
    a: "Puntahan ang AI Tools directory — nakagrupo ito by category (Writing/Research, Coding, Productivity, Creative, Career/Business) na may maikling best-for at pag-iingat bawat isa. Palaging i-check ang current documentation ng provider dahil mabilis magbago ang features nila." },
  { id: "forms", q: "Ano ang Form A at Form B?", follow: ["steps", "usability"],
    keys: ["form a", "form b", "pretest", "posttest", "test", "quiz"],
    a: "Form A ang ginagamit sa pretest (Week 1) at Form B naman sa posttest (Week 4) — magkaiba ang senaryo pero pareho ang tinitignan na competencies, para hindi lang basta pag-alala sa sagot ang masusukat." },
  { id: "usability", q: "Ano ang Usability Evaluation?", follow: ["interview", "steps"],
    keys: ["usability", "evaluation", "feedback sa site", "ano sa site"],
    a: "May Usability Evaluation na sasagutan mo sa Week 4, pagkatapos ng posttest — tungkol ito sa kadalian ng navigation, pagkabasa, Taglish clarity, bilis ng loading, at kung gaano ka-useful ang mga module." },
  { id: "slow", q: "Mabagal ang internet ko, okay lang ba?", follow: ["savefail", "progress"],
    keys: ["mabagal", "slow", "internet", "loading", "connection", "walang net"],
    a: "Dinisenyo ang AIwise para gumana kahit mabagal ang mobile data — walang malalaking larawan o video sa mga module. Kung nag-refresh ka, hindi ka mawawala sa session — naaalala pa rin ng site ang code mo habang bukas ang tab." },
  { id: "resp", q: "Ano ang dapat tandaan sa Responsible Use?", follow: ["tree", "gray"],
    keys: ["responsible use", "paggamit ng ai", "etikal", "tamang gamit"],
    a: "Tingnan ang Module 2 (Responsible Use) para sa mga halimbawa ng tama at maling paggamit ng AI sa academic settings, kasama ang AI Use Decision Tree." },
  { id: "factcheck", q: "Paano gumagana ang Fact-Check module?", follow: ["halluc", "tree"],
    keys: ["fact check", "paano i-verify", "verify", "i-check"],
    a: "Tingnan ang Module 3 (Fact-Check) — dito mo mapapraktis ang pagtukoy ng mga senaryo kung saan mali o gawa-gawa lang ang sagot ng AI, at paano ito i-verify." },
  { id: "interview", q: "Ano ang mangyayari sa interview sa Week 4?", follow: ["usability", "steps"],
    keys: ["interview", "tatanungin", "kausapin", "usap"],
    a: "May maikling interview sa Week 4 na may apat na open-ended na tanong tungkol sa karanasan mo gamit ang mga module — walang tamang o maling sagot dito." },
  { id: "edit", q: "Pwede ko bang baguhin ang My AI Rules ko?", follow: ["rules", "savefail"],
    keys: ["baguhin", "i-edit", "pwede ko bang palitan", "revise", "ulitin ang rules"],
    a: "Oo, pwede mong baguhin ang My AI Rules mo anumang oras bago ang posttest. Sa parehong device at browser, mali-load ulit sa kahon ang huling na-save mo para ma-edit mo ito. Naka-log ang bawat pag-save bilang bagong entry, kaya makikita pa rin ang una mong bersyon kasama ang binago mo." },
  { id: "contact", q: "Sino ang makokontak ko kung may problema?", follow: ["forgot", "savefail"],
    keys: ["kontak", "contact", "sino ang tatanungin", "may problema", "tulong"],
    a: "Kung may problema ka o katanungan tungkol sa study, tingnan ang About page ng AIwise para sa contact details ng researcher." },
  { id: "gray", q: "Ano ang ibig sabihin ng gray area sa modules?", follow: ["tree", "resp"],
    keys: ["gray area", "grey area", "hindi malinaw", "malabo"],
    a: "Sa Module 2 (Responsible Use), tinutukoy ng 'gray area' ang agwat sa pagitan ng 'ginamit ko lang as tulong' at 'AI na mismo ang gumawa nito.' Halos lahat ng gray area ay napupunta sa tatlong sitwasyon: (1) brainstorming/outline vs. buong sanaysay, (2) grammar check vs. code na hindi mo ginawa, at (3) pag-unawa vs. word-for-word na pag-copy. Ang tanong na dapat mong sagutin sa sarili: kung tatanungin ka kung paano mo ginawa 'to, may masasabi ka ba nang hindi nagsu-stutter?" },
  { id: "progress", q: "Paano ko malalaman kung tapos na ako sa module?", follow: ["steps", "rules"],
    keys: ["tapos na", "natapos", "progress", "checkmark", "completed", "kumpleto"],
    a: "Habang nagpapatuloy ka sa mga module, may lalabas na checkmark (\u2713 Done) sa bawat module card sa Home page at mapupuno ang progress bar sa taas ng module. Nagiging 'done' ang isang module kapag pinindot mo ang Next o Finish button sa dulo nito. Nakaimbak ito sa device mo lang, kaya hindi ito susunod sa ibang phone o browser. Hindi rin ito bahagi ng research data." },
  { id: "sitedata", q: "Ano ang nangyayari sa data ko sa AIwise?", follow: ["privacy", "code"],
    keys: ["data ko", "datos ko sa aiwise", "firebase", "google forms", "saan napupunta", "anonymous ba"],
    a: "Ang anonymous code mo ang nag-uugnay sa mga sagot mo nang hindi ginagamit ang pangalan mo. Ang pretest, posttest, Responsible Use Survey, at Usability Evaluation ay dumadaan sa Google Forms, at ang My AI Rules ay naka-save sa Firebase. Ang progress sa mga module at ang huling na-save mong rules ay nasa device mo lang. Huwag maglagay ng pangalan o personal na detalye sa My AI Rules. Para sa buong detalye, tingnan ang 'How your data is handled' sa About page at ang consent form na pinirmahan mo." },
  { id: "savefail", q: "Hindi ma-save ang My AI Rules ko", follow: ["edit", "slow"],
    keys: ["hindi ma-save", "ma-save ang", "di ma-save", "ayaw mag-save", "couldn't save", "hindi nag-save"],
    a: "Kung may lumabas na 'Couldn't save right now', check mo ang internet connection mo at pindutin ulit ang Save — nananatili sa kahon ang isinulat mo kaya hindi mo kailangang ulitin. Kung 'Still loading' naman ang lumabas, maghintay ng ilang segundo at pindutin ulit. Kapag hindi pa rin gumana, sabihin sa iyong researcher." },
];

// ============ 2. Replace chip strip code with the guided menu ============
// Students choose a topic, then a question, then read the answer, so no typing is
// needed. The text box stays as an optional extra and uses the same keyword match.
// Every FAQ entry above has an id, the question shown on its button (q), and up to
// two related questions (follow) offered right after its answer.
const helpById = {};
helpFAQ.forEach(e => { helpById[e.id] = e; });

const helpTopics = [
  { id: "code",     label: "Aking code",           ids: ["signin", "code", "forgot"] },
  { id: "weeks",    label: "Week 1 at Week 4",     ids: ["steps", "progress", "forms", "usability", "interview"] },
  { id: "modules",  label: "Mga module",           ids: ["resp", "tree", "gray", "halluc", "factcheck"] },
  { id: "rules",    label: "My AI Rules at tools", ids: ["rules", "edit", "tools"] },
  { id: "privacy",  label: "Privacy at data",      ids: ["privacy", "sitedata"] },
  { id: "problems", label: "Mga problema",         ids: ["slow", "savefail", "forgot", "contact", "helpbot"] }
];

const HELP_GREETING = "Kumusta! Pumili ng paksa sa ibaba — hindi mo kailangang mag-type. Simpleng guide lang ito na sumasagot batay sa laman ng site, hindi totoong AI.";
const HELP_FALLBACK = "Wala akong direktang sagot dito na tugma sa tanong mo. Subukan ang mga paksa sa ibaba, o itanong nang direkta sa iyong instructor/researcher — ito kasi ay simpleng guide lang batay sa laman ng site, hindi totoong AI.";

function helpAdd(role, text) {
  const log = document.getElementById("helpLog");
  const el = document.createElement("div");
  el.className = "help-msg " + role;
  el.textContent = text;
  log.appendChild(el);
  if (role === "bot") {
    // show the start of an answer, not its end
    log.scrollTop = el.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 6;
  } else {
    log.scrollTop = log.scrollHeight;
  }
}

function helpBtn(text, cls, handler) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  b.addEventListener("click", handler);
  return b;
}

// Rebuilds the menu area. focusFirst is true only for keyboard activation (a click
// event with detail 0), so keyboard users land on the new options without
// touch users seeing a focus ring jump.
function helpRenderMenu(label, optionButtons, layout, showBack, focusFirst) {
  const menu = document.getElementById("helpMenu");
  menu.innerHTML = "";
  const l = document.createElement("div");
  l.className = "help-menu-label";
  l.textContent = label;
  const opts = document.createElement("div");
  opts.className = "help-opts " + layout;
  optionButtons.forEach(b => opts.appendChild(b));
  const foot = document.createElement("div");
  foot.className = "help-menu-foot";
  if (showBack) foot.appendChild(helpBtn("← Mga paksa", "help-link", (e) => showTopics(e.detail === 0)));
  foot.appendChild(helpBtn("Hindi ko makita ang tanong ko", "help-link", helpEscape));
  menu.append(l, opts, foot);
  menu.scrollTop = 0;
  if (focusFirst) { const f = opts.querySelector("button"); if (f) f.focus(); }
}

function showTopics(focusFirst) {
  helpRenderMenu("Pumili ng paksa",
    helpTopics.map(t => helpBtn(t.label, "help-opt topic", (e) => showQuestions(t.id, e.detail === 0))),
    "grid", false, focusFirst);
}

function showQuestions(topicId, focusFirst) {
  const t = helpTopics.find(x => x.id === topicId);
  helpRenderMenu(t.label,
    t.ids.map(id => helpBtn(helpById[id].q, "help-opt", (e) => pickQuestion(id, e.detail === 0))),
    "list", true, focusFirst);
}

function showFollowUps(entry, focusFirst) {
  helpRenderMenu("Susunod na tanong",
    (entry.follow || []).map(id => helpBtn(helpById[id].q, "help-opt", (e) => pickQuestion(id, e.detail === 0))),
    "list", true, focusFirst);
}

function pickQuestion(id, focusFirst) {
  const entry = helpById[id];
  helpAdd("user", entry.q);
  helpAdd("bot", entry.a);
  showFollowUps(entry, focusFirst);
}

// "I can't find my question": point to the researcher's contact details on the
// About page instead of guessing an answer.
function helpEscape() {
  helpAdd("user", "Hindi ko makita ang tanong ko");
  helpAdd("bot", "Sige — bubuksan ko ang About page kung nasaan ang contact ng researcher. Pwede mo siyang tanungin nang direkta.");
  showTopics(false);
  document.getElementById("helpPanel").classList.add("hidden");
  openAbout("aboutContact");
}

// Back to the greeting and the topic buttons (used on load and by Clear chat).
function helpReset() {
  document.getElementById("helpLog").innerHTML = "";
  document.getElementById("helpInput").value = "";
  helpAdd("bot", HELP_GREETING);
  showTopics(false);
}
helpReset();
renderProgress();
restoreRules();
renderHome();
autoOpenStep();

// Clear chat: empties the conversation and returns to the greeting and topic buttons.
function clearHelp() { helpReset(); }

function toggleHelp() {
  document.getElementById("helpPanel").classList.toggle("hidden");
}

function findHelp(question) {
  const q = question.toLowerCase();
  let best = null, bestScore = 0;
  for (const entry of helpFAQ) {
    const score = entry.keys.reduce((n, k) => n + (q.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return best;
}

function matchHelp(question) {
  const entry = findHelp(question);
  return entry ? entry.a : HELP_FALLBACK;
}

// Optional typed question: same fixed answers, matched by keywords.
function askHelp() {
  const input = document.getElementById("helpInput");
  const question = input.value.trim();
  if (!question) return;
  helpAdd("user", question);
  input.value = "";
  const entry = findHelp(question);
  if (entry) { helpAdd("bot", entry.a); showFollowUps(entry, false); }
  else { helpAdd("bot", HELP_FALLBACK); showTopics(false); }
}
