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
      <img src="${s.src}" alt="${s.tag} being carried out at the clinic" loading="lazy" decoding="async"
           onerror="this.closest('figure').remove()">
      <figcaption class="shot__tag">${s.tag}</figcaption>
    </figure>`).join("");

  // These are photographs of treatment in progress. They are never
  // labelled as before-and-after results, because they are not.
  if (ph) {
    $("#galleryTitle").textContent = "Inside the room.";
    $("#galleryLede").textContent =
      "Treatment photography, not before-and-after. Results photographs go here once the " +
      "clinic has them — same lighting, same angle, same camera, shared with written consent.";
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
   2d · AREA LINKS
   Internal links into the programmatic SEO pages. Without these
   the generated pages are orphans — indexable via sitemap, but
   with no internal authority flowing to them, so they rank badly.
   Built from the same CLINIC.seo block the generator reads, so
   the two can never drift apart.
   ============================================================ */
const seoSlug = s => s.toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function renderAreas() {
  const box = $("#areaLinks"); if (!box) return;
  const seo = CLINIC.seo;
  if (!seo || !seo.enabled || !seo.areas || !seo.areas.length) {
    box.closest("section").remove(); return;
  }
  const treats = (seo.treatments || [])
    .map(getTreatment).filter(Boolean);

  box.innerHTML = seo.areas.map(a => `
    <div class="area">
      <h3 class="area__n">${a.name}</h3>
      <ul class="area__l">
        ${treats.map(t => `<li><a href="${seo.outDir}/${seoSlug(t.name)}-${seoSlug(a.name)}.html">${t.name}</a></li>`).join("")}
      </ul>
    </div>`).join("");
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
  captureAbandoned();
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

/* ------------------------------------------------------------
   Abandoned booking capture.

   Someone who has chosen a treatment, a date and a time and typed
   their email has told us almost everything. If they then leave
   without confirming, that is recorded once so the engine can
   follow up with the exact slot they were looking at.

   Nothing is recorded unless they typed an email themselves, and
   nothing is recorded once the booking is actually confirmed.
   ------------------------------------------------------------ */
let abandonSent = false;

function captureAbandoned() {
  if (abandonSent) return;
  if (B.step < 4 || B.step === 5) return;          // not far enough in, or already booked
  if (!B.treatment || !B.date || !B.time) return;

  const email = ($("#fEmail") || {}).value ? $("#fEmail").value.trim() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;

  abandonSent = true;
  const payload = {
    action: "abandon",
    firstName: ($("#fName") || {}).value || "",
    email: email,
    phone: ($("#fPhone") || {}).value || "",
    treatmentId: B.treatment.id,
    treatmentName: B.treatment.name,
    date: B.date,
    time: B.time
  };

  if (CLINIC.isDemoMode()) { console.info("[demo] abandoned booking captured", payload); return; }
  try {
    // keepalive so it still goes if the tab is closing
    fetch(CLINIC.booking.webAppUrl, { method: "POST", body: JSON.stringify(payload), keepalive: true });
  } catch (e) { /* never block the close on this */ }
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
  btnNext.hidden = false;   // the waitlist hides it; every other step needs it
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

  // The first few open days are full. A sought-after clinic is booked a
  // week out, and it is what puts the waitlist in front of the visitor
  // rather than hiding it behind a rare empty day.
  if (daysOut <= 3) return [];

  const freeRate = Math.min(0.78, 0.30 + (daysOut - 3) * 0.045);

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

  /* A full day is not a dead end. It is the front door to the waitlist,
     which is the automation that refills cancellations. */
  if (!slots.length) {
    renderWaitlist(area, pretty);
    return;
  }

  area.innerHTML = `
    <div class="notice">${pretty}, ${B.treatment.name}, ${formatDuration(B.treatment.duration)}</div>
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
  abandonSent = true;               // confirmed, so never chase it as abandoned
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
   6 · CHROME — nav
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

  /* No blanket scroll-reveal. Every section is legible the moment the
     page loads; the only entrance on the page is the hero, and it is
     done in CSS. */
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
renderAreas();
renderFilters();
renderMenu();
renderAftercare();
wireBookButtons();
chrome();
initChat();

/* ============================================================
   7 · THE ENGINE — automation catalogue
   ------------------------------------------------------------
   Reads automations.js. Nothing here is hand-written per item, so
   adding an automation to the catalogue adds it to the page.
   ============================================================ */

const CAT = { group: "all" };

function renderAutomations() {
  const list = $("#catList");
  if (!list || typeof AUTOMATIONS === "undefined") return;

  /* --- group filters --- */
  const filters = $("#catFilters");
  const groups  = [{ id: "all", label: "Everything" }, ...AUTOMATION_GROUPS];
  filters.innerHTML = groups.map(g =>
    `<button type="button" data-group="${g.id}" aria-pressed="${g.id === CAT.group}">${g.label}</button>`
  ).join("");
  filters.addEventListener("click", e => {
    const b = e.target.closest("button[data-group]");
    if (!b) return;
    CAT.group = b.dataset.group;
    $$("button[data-group]", filters).forEach(x =>
      x.setAttribute("aria-pressed", String(x.dataset.group === CAT.group)));
    paintCatalogue();
  });

  paintCatalogue();

  /* --- footnote: how many ship on their own --- */
  const standalone = AUTOMATIONS.filter(a => a.standalone).length;
  $("#catNote").textContent =
    `${standalone} of these ${AUTOMATIONS.length} run on their own, on top of whatever booking ` +
    `system a clinic already uses. The rest need the diary underneath them and ship with it.`;
}

function paintCatalogue() {
  const showFees = !!(CLINIC.commercial && CLINIC.commercial.showFees);
  const rows = CAT.group === "all" ? AUTOMATIONS : automationsIn(CAT.group);

  $("#catList").innerHTML = rows.map(a => `
    <article class="cat__row">
      <div>
        <div class="cat__name">${a.name}</div>
        <span class="cat__when">${a.when}</span>
      </div>
      <div>
        <p class="cat__does">${a.does}</p>
        <p class="cat__pay">${a.payoff}</p>
      </div>
      <div class="cat__side">
        <ul class="cat__needs">${(a.needs || []).map(n => `<li>${n}</li>`).join("")}</ul>
        ${a.standalone
          ? `<span class="cat__tag">Sold on its own</span>
             ${showFees && a.fee ? `<span class="cat__fee">${a.fee} one-off</span>` : ""}`
          : `<span class="cat__tag" data-bundled>Ships with the booking system</span>`}
      </div>
    </article>`).join("");
}

/* ============================================================
   8 · THE REFILL SEQUENCE
   ------------------------------------------------------------
   The one piece of choreographed motion on the page. It plays the
   waitlist automation honestly: the first person on the list does
   not reply, so the slot moves down the list on its own. That
   cascade is the whole point of the automation, so it is what the
   animation shows.

   The widget is fully legible before it plays. Nothing is hidden
   waiting on an observer.
   ============================================================ */

function initRefill() {
  const root = $("#refill");
  if (!root) return;

  const play  = $("#refillPlay");
  const slot  = $("#refillSlot");
  const who   = $("#slotWho");
  const state = $("#slotState");
  const say   = $("#refillSay");
  const held  = $("#statHeld");
  const time  = $("#statTime");
  const rows  = id => $(`.wl__row[data-wl="${id}"]`);

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, calm ? Math.min(ms, 220) : ms));

  const setRow = (n, st, label) => {
    const r = rows(n); if (!r) return;
    r.dataset.state = st;
    $("[data-stat]", r).textContent = label;
  };

  function reset() {
    slot.dataset.state = "booked";
    who.textContent = "Marianne Okafor";
    state.textContent = "Confirmed";
    held.textContent = "£420"; held.removeAttribute("data-flash");
    time.textContent = "—";
    [1, 2, 3, 4].forEach(n => setRow(n, "waiting", "Waiting"));
    say.innerHTML = "The appointment is confirmed and the waitlist is idle. Press the button to cancel it.";
  }

  async function run() {
    play.setAttribute("data-running", "");
    play.textContent = "Running…";

    /* 1 — the cancellation */
    slot.dataset.state = "cancelled";
    state.textContent = "Cancelled";
    held.textContent = "£0";
    say.innerHTML = "<strong>Marianne cancels at 11:04.</strong> Under the old system this is now an empty hour on Thursday, and nobody finds out until the day.";
    await wait(2200);

    /* 2 — the engine starts hunting */
    slot.dataset.state = "hunting";
    state.textContent = "Refilling";
    say.innerHTML = "The slot is released to the waitlist automatically. Nobody at the clinic has touched anything.";
    await wait(1500);

    /* 3 — first in line, because she wants this exact treatment */
    setRow(1, "notified", "Offered · 20 min");
    say.innerHTML = "<strong>Priya is asked first</strong> — she is waiting for this exact treatment. She gets a link that expires in twenty minutes.";
    await wait(2400);

    /* 4 — she doesn't take it, so it moves down on its own */
    setRow(1, "passed", "No reply");
    setRow(2, "notified", "Offered · 20 min");
    say.innerHTML = "Twenty minutes pass with no reply, so the offer moves down the list on its own. <strong>Joanne is next</strong> — she wants any Thursday evening.";
    await wait(2600);

    /* 5 — claimed */
    setRow(2, "claimed", "Claimed");
    say.innerHTML = "<strong>Joanne takes it.</strong> Her confirmation, her medical history form and her prep instructions all go out on the same schedule as any other booking.";
    await wait(1400);

    /* 6 — the slot is whole again */
    slot.dataset.state = "refilled";
    state.textContent = "Confirmed";
    who.textContent = "Joanne Whitfield";
    held.textContent = "£420";
    held.setAttribute("data-flash", "");
    time.textContent = "41 min";
    setRow(3, "waiting", "Still waiting");
    setRow(4, "waiting", "Still waiting");
    say.innerHTML = "<strong>The hour is booked again, forty-one minutes after it was lost.</strong> The practitioner was with a client for all of it and sent nothing.";

    play.removeAttribute("data-running");
    play.textContent = "Run it again";
  }

  play.addEventListener("click", () => { reset(); requestAnimationFrame(run); });

  /* Play once, unprompted, the first time it is properly on screen —
     but only after the reader has had a moment to read the resting
     state, and never for someone who has asked for less motion. */
  if (!calm && "IntersectionObserver" in window) {
    let done = false;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting || done) return;
        done = true; io.disconnect();
        setTimeout(run, 900);
      });
    }, { threshold: 0.45 });
    io.observe(root);
  }
}

/* These two live at the end because their state is declared below the
   original boot block, and a `const` cannot be touched before it is
   initialised. */
renderAutomations();
initRefill();

/* ============================================================
   9 · WAITLIST
   ------------------------------------------------------------
   Shown instead of "try another date" when a day is full. This is
   the client-facing half of the waitlist automation: the list this
   form writes to is the list the engine works down when somebody
   cancels.
   ============================================================ */

function renderWaitlist(area, pretty) {
  // No Continue on this step. The waitlist has its own action, and a
  // permanently disabled button is a dead end the visitor has to guess at.
  btnNext.hidden = true;
  area.innerHTML = `
    <div class="wlist">
      <div class="wlist__top">
        <h4>${pretty} is full.</h4>
        <p class="muted">
          Join the waitlist and you will be offered this day the moment somebody moves.
          Most cancellations come in the day before, and the first person who can take
          the slot gets it.
        </p>
      </div>

      <fieldset class="wlist__flex">
        <legend>How flexible are you?</legend>
        <label><input type="radio" name="wlFlex" value="day" checked>
          <span><strong>This day only</strong><em>You are offered cancellations on ${pretty}</em></span></label>
        <label><input type="radio" name="wlFlex" value="week">
          <span><strong>That week</strong><em>Any day in the same week</em></span></label>
        <label><input type="radio" name="wlFlex" value="any">
          <span><strong>Any time</strong><em>First cancellation for this treatment, whenever it falls</em></span></label>
      </fieldset>

      <div class="field-row">
        <div class="field">
          <label for="wlName">First name</label>
          <input id="wlName" autocomplete="given-name">
        </div>
        <div class="field">
          <label for="wlPhone">Mobile</label>
          <input id="wlPhone" type="tel" autocomplete="tel" placeholder="07…">
        </div>
      </div>
      <div class="field">
        <label for="wlEmail">Email</label>
        <input id="wlEmail" type="email" autocomplete="email">
      </div>

      <div class="err" id="wlErr" hidden></div>
      <button class="btn btn--gold btn--block" id="wlGo" type="button">Join the waitlist</button>
      <p class="wlist__small muted2">
        You are only contacted about this treatment, and every offer expires so the slot
        keeps moving. One tap removes you.
      </p>
    </div>`;

  $("#wlGo").addEventListener("click", () => joinWaitlist(area, pretty));
}

async function joinWaitlist(area, pretty) {
  const err   = $("#wlErr");
  const name  = $("#wlName").value.trim();
  const email = $("#wlEmail").value.trim();
  const phone = $("#wlPhone").value.trim();
  const flex  = (document.querySelector("input[name=wlFlex]:checked") || {}).value || "day";
  err.hidden = true;

  if (!name || !email || !phone) {
    err.textContent = "Please add your name, email and mobile."; err.hidden = false; return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    err.textContent = "That email address doesn't look right."; err.hidden = false; return;
  }

  const go = $("#wlGo");
  go.disabled = true; go.textContent = "Joining…";

  try {
    if (!CLINIC.isDemoMode()) {
      await fetch(CLINIC.booking.webAppUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "waitlist",
          firstName: name, email, phone, flexibility: flex,
          treatmentId: B.treatment.id, treatmentName: B.treatment.name,
          duration: B.treatment.duration, date: B.date
        })
      });
    } else {
      await new Promise(r => setTimeout(r, 700));
    }
  } catch (e) {
    err.textContent = "Couldn't join the waitlist just now. Message us on WhatsApp and we'll add you by hand.";
    err.hidden = false;
    go.disabled = false; go.textContent = "Join the waitlist";
    return;
  }

  const scope = flex === "day"  ? pretty
              : flex === "week" ? "that week"
              :                   "any date";
  area.innerHTML = `
    <div class="wlist wlist--done">
      <h4>You're on the list.</h4>
      <p class="muted">
        You are waiting on <strong>${B.treatment.name}</strong> for <strong>${scope}</strong>.
        If somebody cancels you will hear within seconds, and you will have twenty minutes
        to take the slot before it passes to the next person.
      </p>
      <p class="muted2 wlist__small">Nothing is booked and nothing is owed.</p>
    </div>`;
}

/* Leaving the page with the sheet open is the same as closing it. */
window.addEventListener("pagehide", captureAbandoned);
