/* ============================================================
   CLINIC OS — FRONT END
   Hydration, treatment menu, aftercare, booking flow.
   ============================================================ */

/* ---------- tiny helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const dig = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DOW  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ============================================================
   1 · HYDRATE CONFIG INTO THE PAGE
   ============================================================ */
function hydrate() {
  $$("[data-clinic]").forEach(el => {
    const v = dig(CLINIC, el.dataset.clinic);
    // Guard: never overwrite an element that wraps other elements — setting
    // textContent there would delete its children.
    if (v != null && v !== "" && !el.firstElementChild) el.textContent = v;
  });
  $$("[data-clinic-href]").forEach(el => {
    const v = dig(CLINIC, el.dataset.clinicHref);
    if (v) el.href = v; else el.style.display = "none";
  });
  $$("[data-clinic-tel]").forEach(el => {
    const v = dig(CLINIC, el.dataset.clinicTel);
    if (v) el.href = "tel:" + v.replace(/\s/g, "");
  });
  $$("[data-clinic-mailto]").forEach(el => {
    const v = dig(CLINIC, el.dataset.clinicMailto);
    if (v) el.href = "mailto:" + v;
  });
  $$("[data-whatsapp]").forEach(el => {
    el.href = CLINIC.whatsappLink(`Hi ${CLINIC.shortName}, I'd like to ask about a treatment.`);
  });
  $$("[data-img]").forEach(el => {
    const v = dig(CLINIC, el.dataset.img);
    if (v) el.src = v; else el.remove();
  });
  const y = $("#yr"); if (y) y.textContent = new Date().getFullYear();
  document.title = `${CLINIC.name} — ${CLINIC.tagline}`;
}

/* ============================================================
   2 · OPENING HOURS
   ============================================================ */
function renderHours() {
  const box = $("#hoursList"); if (!box) return;
  const today = new Date().getDay();
  const order = [1,2,3,4,5,6,0];
  box.innerHTML = order.map(d => {
    const h = CLINIC.hours[d];
    return `<div class="hours-row ${d === today ? "is-today" : ""}">
      <span>${DOW[d]}</span>
      <span>${h ? `${h.open} – ${h.close}` : "Closed"}</span>
    </div>`;
  }).join("");
}

/* ============================================================
   2b · RESULTS GALLERY
   ============================================================ */
function renderGallery() {
  const box = $("#gallery"); if (!box) return;
  const g   = CLINIC.images.gallery || [];
  const ph  = CLINIC.images.galleryIsPlaceholder;

  box.innerHTML = g.map(s => `
    <figure class="shot">
      <img src="${s.src}" alt="" loading="lazy" onerror="this.remove()">
      <figcaption class="shot__tag">${s.tag}</figcaption>
    </figure>`).join("");

  // Never label stock imagery as real client results.
  if (ph) {
    $("#galleryTitle").textContent = "The look and feel.";
    $("#galleryLede").textContent =
      "Placeholder imagery for this demo. On a live clinic site this section holds real " +
      "before-and-after photographs — same lighting, same angle, shared with written consent.";
  }
}

/* ============================================================
   2c · TRUST — structural promises, never invented social proof
   ============================================================ */
function renderTrust() {
  const box = $("#trust"); if (!box) return;
  const list = CLINIC.trust || [];
  if (!list.length) { box.closest("section").remove(); return; }
  box.innerHTML = list.map(t => `
    <article class="trust__card">
      <div class="trust__k">${t.key}</div>
      <h3>${t.title}</h3>
      <p>${t.body}</p>
    </article>`).join("");
}

/* ============================================================
   3 · TREATMENT MENU
   ============================================================ */
let activeFilter = "all";

function renderFilters() {
  const box = $("#filters"); if (!box) return;
  const cats = [{ id: "all", label: "All treatments" }, ...TREATMENT_CATEGORIES];
  box.innerHTML = cats.map(c =>
    `<button class="filter ${c.id === activeFilter ? "is-active" : ""}" data-cat="${c.id}">${c.label}</button>`
  ).join("");
  $$(".filter", box).forEach(b => b.addEventListener("click", () => {
    activeFilter = b.dataset.cat;
    renderFilters(); renderMenu();
  }));
}

function renderMenu() {
  const box = $("#menu"); if (!box) return;
  const list = TREATMENTS.filter(t => activeFilter === "all" || t.category === activeFilter);
  box.innerHTML = list.map(t => `
    <article class="item">
      <div>
        <h3 class="item__name">${t.name}</h3>
        <p class="item__sum">${t.summary}</p>
        <div class="item__meta">
          <span>${formatDuration(t.duration)}</span>
          ${t.rebookWeeks ? `<span>Typically every ${t.rebookWeeks} weeks</span>` : ""}
        </div>
      </div>
      <div class="item__right">
        <div class="item__price">${formatPrice(t)}</div>
        <button class="item__book" data-book data-treatment="${t.id}">Book</button>
      </div>
    </article>`).join("");
  wireBookButtons();
}

/* ============================================================
   4 · AFTERCARE ACCORDION
   ============================================================ */
function renderAftercare() {
  const box = $("#aftercareAcc"); if (!box) return;
  const list = TREATMENTS.filter(t => t.aftercare.length);
  box.innerHTML = list.map(t => `
    <div class="acc__row">
      <button class="acc__head" type="button">
        <span>${t.name}</span><span class="acc__sign"></span>
      </button>
      <div class="acc__body">
        <div class="acc__inner">
          ${t.prep.length ? `<div>
            <p class="care-title">Before your appointment</p>
            <ul class="care-list">${t.prep.map(p => `<li>${p}</li>`).join("")}</ul>
          </div>` : ""}
          <div>
            <p class="care-title">After your treatment</p>
            <ul class="care-list">${t.aftercare.map(p => `<li>${p}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    </div>`).join("");

  $$(".acc__head", box).forEach(head => head.addEventListener("click", () => {
    const row  = head.parentElement;
    const body = $(".acc__body", row);
    const open = row.classList.contains("is-open");
    $$(".acc__row", box).forEach(r => {
      r.classList.remove("is-open");
      $(".acc__body", r).style.maxHeight = null;
    });
    if (!open) { row.classList.add("is-open"); body.style.maxHeight = body.scrollHeight + "px"; }
  }));
}

/* ============================================================
   5 · BOOKING FLOW
   ============================================================ */
const B = { step: 1, treatment: null, date: null, time: null, cursor: new Date() };

const modal   = $("#modal");
const btnNext = $("#btnNext");
const btnBack = $("#btnBack");

function openModal(treatmentId) {
  B.step = 1; B.treatment = null; B.date = null; B.time = null;
  B.cursor = new Date(); B.cursor.setDate(1);
  renderPicker();
  if (treatmentId) {
    B.treatment = getTreatment(treatmentId);
    markPicked();
    B.step = 2;
  }
  buildCalendar();
  paint();
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function wireBookButtons() {
  $$("[data-book]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => openModal(b.dataset.treatment));
  });
}

/* --- step painting --- */
const LABELS = {
  1: "Step 1 of 4 — Choose a treatment",
  2: "Step 2 of 4 — Pick a date",
  3: "Step 3 of 4 — Pick a time",
  4: "Step 4 of 4 — Your details",
  5: "Confirmed"
};
function paint() {
  $$(".pane").forEach(p => p.classList.toggle("is-active", +p.dataset.pane === B.step));
  $$(".step-dot").forEach((d, i) => d.classList.toggle("is-done", i < Math.min(B.step, 4)));
  $("#sheetSub").textContent = LABELS[B.step];
  $("#steps").style.display = B.step === 5 ? "none" : "flex";
  $("#sheetFoot").style.display = B.step === 5 ? "none" : "flex";
  btnBack.style.visibility = B.step > 1 ? "visible" : "hidden";
  btnNext.textContent = B.step === 4 ? "Confirm booking" : "Continue";
  btnNext.disabled =
    (B.step === 1 && !B.treatment) ||
    (B.step === 2 && !B.date) ||
    (B.step === 3 && !B.time);
  if (B.step === 4) btnNext.disabled = false;
  $(".sheet__body").scrollTop = 0;
}

/* --- 5a · treatment picker --- */
function renderPicker() {
  const box = $("#pickList");
  let html = "";
  TREATMENT_CATEGORIES.forEach(cat => {
    const items = TREATMENTS.filter(t => t.category === cat.id);
    if (!items.length) return;
    html += `<p class="pick__group">${cat.label}</p>`;
    html += items.map(t => `
      <button class="pick__opt" type="button" data-t="${t.id}">
        <span class="pick__n">${t.name}</span>
        <span class="pick__p">${formatPrice(t)}</span>
        <span class="pick__d">${formatDuration(t.duration)}</span>
      </button>`).join("");
  });
  box.innerHTML = html;
  $$(".pick__opt", box).forEach(b => b.addEventListener("click", () => {
    B.treatment = getTreatment(b.dataset.t);
    B.date = null; B.time = null;
    markPicked(); buildCalendar();
    chatLockTreatment(B.treatment.name);
    B.step = 2;                       // straight on to the date — Back still available
    paint();
  }));
}
function markPicked() {
  $$(".pick__opt").forEach(o => o.classList.toggle("is-sel", B.treatment && o.dataset.t === B.treatment.id));
}

/* --- 5b · calendar --- */
function dayIsOpen(d) {
  const h = CLINIC.hours[d.getDay()];
  if (!h) return false;
  const min = new Date(Date.now() + CLINIC.booking.minNoticeHours * 3600e3);
  const max = new Date(Date.now() + CLINIC.booking.maxDaysAhead * 864e5);
  const end = new Date(d); end.setHours(23, 59, 59);
  return end >= min && d <= max;
}

function buildCalendar() {
  const grid  = $("#calGrid");
  const cur   = B.cursor;
  $("#calMonth").textContent = `${MON[cur.getMonth()]} ${cur.getFullYear()}`;

  const first  = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const days   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;              // Monday-first

  let html = ["M","T","W","T","F","S","S"].map(d => `<div class="cal__dow">${d}</div>`).join("");
  html += Array(offset).fill('<div class="cal__day is-empty"></div>').join("");

  for (let i = 1; i <= days; i++) {
    const d  = new Date(cur.getFullYear(), cur.getMonth(), i);
    const ok = dayIsOpen(d);
    const on = B.date === ymd(d);
    html += `<button class="cal__day ${on ? "is-sel" : ""}" data-d="${ymd(d)}" ${ok ? "" : "disabled"}>${i}</button>`;
  }
  grid.innerHTML = html;

  $$(".cal__day[data-d]:not(:disabled)", grid).forEach(b => b.addEventListener("click", () => {
    B.date = b.dataset.d; B.time = null;
    buildCalendar(); B.step = 3; loadSlots(); paint();
  }));

  const now = new Date();
  $("#calPrev").disabled = cur.getFullYear() === now.getFullYear() && cur.getMonth() === now.getMonth();
  const maxD = new Date(Date.now() + CLINIC.booking.maxDaysAhead * 864e5);
  $("#calNext").disabled = cur.getFullYear() === maxD.getFullYear() && cur.getMonth() === maxD.getMonth();
}

/* --- 5c · slots --- */
function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function toHHMM(mins) { return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }

/* deterministic pseudo-random (mulberry32) so the same date always shows the
   same demo availability — reloading doesn't reshuffle the day. */
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoSlots(dateStr, duration) {
  const d = new Date(dateStr + "T00:00:00");
  const h = CLINIC.hours[d.getDay()];
  if (!h) return [];
  const rnd  = seeded(dateStr);
  const out  = [];
  // Busier the sooner it is, quieter further out — reads like a real diary.
  const daysOut = Math.max(0, Math.round((d - new Date().setHours(0,0,0,0)) / 864e5));
  const freeRate = Math.min(0.78, 0.34 + daysOut * 0.035);

  for (let m = toMin(h.open); m + duration <= toMin(h.close); m += 30) {
    if (rnd() < freeRate) out.push(toHHMM(m));
  }
  return out;
}

async function loadSlots() {
  const area = $("#slotArea");
  area.innerHTML = '<div class="spinner"></div>';
  const pretty = new Date(B.date + "T00:00:00")
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  let slots = [];
  try {
    if (CLINIC.isDemoMode()) {
      await new Promise(r => setTimeout(r, 420));
      slots = demoSlots(B.date, B.treatment.duration);
    } else {
      const url = `${CLINIC.booking.webAppUrl}?action=slots&date=${B.date}&duration=${B.treatment.duration}`;
      const res = await fetch(url);
      const data = await res.json();
      slots = data.slots || [];
    }
  } catch (e) {
    area.innerHTML = `<p class="slots-empty">Couldn't load times just now.<br>
      Please <a data-whatsapp target="_blank" rel="noopener">message us on WhatsApp</a> and we'll book you in.</p>`;
    hydrate();
    return;
  }

  if (!slots.length) {
    area.innerHTML = `<p class="slots-empty">No availability on ${pretty}.<br>Try another date.</p>`;
    return;
  }

  area.innerHTML = `
    <div class="notice">${pretty} · ${B.treatment.name} · ${formatDuration(B.treatment.duration)}</div>
    <div class="slots">${slots.map(s => `<button class="slot" data-t="${s}">${s}</button>`).join("")}</div>`;

  $$(".slot", area).forEach(b => b.addEventListener("click", () => {
    B.time = b.dataset.t;
    $$(".slot", area).forEach(x => x.classList.toggle("is-sel", x === b));
    paint();
  }));
}

/* --- 5d · recap + submit --- */
function renderRecap() {
  const pretty = new Date(B.date + "T00:00:00")
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#recap").innerHTML = `
    <div class="recap__row"><span class="muted">Treatment</span><strong>${B.treatment.name}</strong></div>
    <div class="recap__row"><span class="muted">When</span><strong>${pretty} at ${B.time}</strong></div>
    <div class="recap__row"><span class="muted">Length</span><strong>${formatDuration(B.treatment.duration)}</strong></div>
    <div class="recap__row"><span class="muted">Payable in clinic</span><strong>${formatPrice(B.treatment)}</strong></div>`;
}

async function submitBooking() {
  const err = $("#formErr");
  err.hidden = true;

  const payload = {
    firstName: $("#fName").value.trim(),
    lastName:  $("#lName").value.trim(),
    email:     $("#fEmail").value.trim(),
    phone:     $("#fPhone").value.trim(),
    notes:     $("#fNotes").value.trim(),
    treatmentId:   B.treatment.id,
    treatmentName: B.treatment.name,
    duration: B.treatment.duration,
    price:    B.treatment.price,
    date: B.date,
    time: B.time,
    consent: $("#fConsent").checked
  };

  if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
    err.textContent = "Please fill in your name, email and mobile."; err.hidden = false; return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    err.textContent = "That email address doesn't look right."; err.hidden = false; return;
  }
  if (!payload.consent) {
    err.textContent = "Please tick the consent box so we can manage your appointment."; err.hidden = false; return;
  }

  btnNext.disabled = true; btnNext.textContent = "Booking…";

  try {
    if (CLINIC.isDemoMode()) {
      await new Promise(r => setTimeout(r, 900));
    } else {
      const res  = await fetch(CLINIC.booking.webAppUrl, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Booking failed");
    }
  } catch (e) {
    err.textContent = "Something went wrong saving your booking. Please message us on WhatsApp and we'll sort it.";
    err.hidden = false;
    btnNext.disabled = false; btnNext.textContent = "Confirm booking";
    return;
  }

  const pretty = new Date(B.date + "T00:00:00")
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  $("#doneLine").textContent = `${B.treatment.name} — ${pretty} at ${B.time}`;
  $("#formLink").href = CLINIC.forms.medicalHistory;
  $("#sheetTitle").textContent = "Appointment confirmed";
  B.step = 5; paint();
  btnNext.textContent = "Confirm booking";
}

/* --- nav buttons --- */
btnNext.addEventListener("click", () => {
  if (B.step === 1 && B.treatment) { B.step = 2; buildCalendar(); paint(); return; }
  if (B.step === 2 && B.date)      { B.step = 3; loadSlots();     paint(); return; }
  if (B.step === 3 && B.time)      { B.step = 4; renderRecap();   paint(); return; }
  if (B.step === 4)                { submitBooking(); }
});
btnBack.addEventListener("click", () => {
  if (B.step > 1) { B.step--; if (B.step === 3) loadSlots(); paint(); }
});
$("#closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
$("#calPrev").addEventListener("click", () => { B.cursor.setMonth(B.cursor.getMonth() - 1); buildCalendar(); });
$("#calNext").addEventListener("click", () => { B.cursor.setMonth(B.cursor.getMonth() + 1); buildCalendar(); });

/* ============================================================
   6 · CHROME — nav, reveal
   ============================================================ */
function chrome() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  $("#burger").addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    $("#burger").setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => nav.classList.remove("is-open")));

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));
}

/* ============================================================
   7 · WHATSAPP CHAT WIDGET
   Contextual: the prompt follows the section being read, and
   switches to the treatment once one is opened in the booking flow.
   ============================================================ */
const CHAT = { context: "top", locked: null, opened: false };

function chatMessage() {
  const c = CLINIC.chat;
  if (CHAT.locked) return c.treatmentPrompt.replace("{treatment}", CHAT.locked);
  return c.prompts[CHAT.context] || c.prompts.top;
}

function chatOutbound() {
  const what = CHAT.locked
    ? `about ${CHAT.locked}`
    : ({ treatments: "about your treatments", results: "about your results",
         aftercare: "about aftercare", visit: "about visiting the clinic",
         about: `for ${CLINIC.practitioner.name}` }[CHAT.context] || "");
  return CLINIC.whatsappLink(`Hi ${CLINIC.shortName}, I have a question ${what}`.trim().replace(/\s+/g, " "));
}

function paintChat() {
  const bubble = $("#chatBubble");
  const msg = chatMessage();
  if (bubble && bubble.textContent !== msg) {
    bubble.textContent = msg;
    bubble.style.animation = "none"; void bubble.offsetWidth; bubble.style.animation = "";
  }
  const go = $("#chatGo"); if (go) go.href = chatOutbound();
}

function initChat() {
  const wrap = $("#chat");
  if (!wrap) return;
  if (!CLINIC.chat.enabled) { wrap.remove(); return; }

  const setOpen = (open) => {
    wrap.classList.toggle("is-open", open);
    $("#chatFab").setAttribute("aria-expanded", open);
    if (open) { CHAT.opened = true; paintChat(); }
  };

  $("#chatFab").addEventListener("click", () => setOpen(!wrap.classList.contains("is-open")));
  $("#chatClose").addEventListener("click", (e) => { e.stopPropagation(); setOpen(false); });
  $("#chatGo").addEventListener("click", () => setOpen(false));

  // Which section is the visitor reading?
  const sections = ["top","about","treatments","results","reviews","aftercare","visit"]
    .map(id => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { CHAT.context = en.target.id; paintChat(); }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => io.observe(s));

  // Auto-open once per visit, and never over an open booking modal.
  const delay = CLINIC.chat.autoOpenAfter;
  if (delay > 0) {
    let shown = false;
    try { shown = sessionStorage.getItem("chatShown") === "1"; } catch (e) {}
    if (!shown) {
      setTimeout(() => {
        if (CHAT.opened || modal.classList.contains("is-open")) return;
        setOpen(true);
        try { sessionStorage.setItem("chatShown", "1"); } catch (e) {}
      }, delay * 1000);
    }
  }

  paintChat();
}

/** Called when a treatment is chosen, so the bubble follows the intent. */
function chatLockTreatment(name) { CHAT.locked = name; paintChat(); }

/* ============================================================
   BOOT
   ============================================================ */
hydrate();
renderHours();
renderGallery();
renderTrust();
renderFilters();
renderMenu();
renderAftercare();
wireBookButtons();
chrome();
initChat();
