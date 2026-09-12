/* ============================================================
   CLINIC OS — TREATMENT MENU
   ------------------------------------------------------------
   Edit prices, durations, copy and aftercare here.
   `rebookWeeks` drives the automatic rebooking nudge.
   ============================================================ */

const TREATMENT_CATEGORIES = [
  { id: "injectables", label: "Injectables",   note: "Wrinkle relaxing & dermal filler" },
  { id: "skin",        label: "Skin",          note: "Resurfacing, peels & skin health" },
  { id: "advanced",    label: "Advanced",      note: "Collagen stimulation & contouring" },
  { id: "consult",     label: "Consultation",  note: "Start here if you're unsure" }
];

const TREATMENTS = [

  /* ---------------- CONSULTATION ---------------- */
  {
    id: "consultation",
    category: "consult",
    name: "Consultation",
    price: 0,
    priceLabel: "Complimentary",
    duration: 30,
    summary: "A proper conversation about what's bothering you and whether treatment is the right answer.",
    detail: "No treatment on the day, no pressure, no obligation. You leave with a written plan and a price — " +
            "or with an honest 'you don't need this'.",
    rebookWeeks: null,
    prep: [],
    aftercare: []
  },

  /* ---------------- INJECTABLES ---------------- */
  {
    id: "wrinkle-one",
    category: "injectables",
    name: "Wrinkle Relaxing — One Area",
    price: 180,
    duration: 30,
    summary: "Forehead, frown lines or crow's feet. Softened, not frozen.",
    detail: "Results settle over 10–14 days and last around three months. First-time clients get a free " +
            "two-week review to fine-tune.",
    rebookWeeks: 12,
    prep: [
      "No alcohol for 24 hours before your appointment",
      "Avoid ibuprofen, aspirin and fish oil for 48 hours (unless prescribed)",
      "Come with a clean face — no make-up if possible"
    ],
    aftercare: [
      "Stay upright for 4 hours — no lying down or leaning forward",
      "No exercise, sauna or steam for 24 hours",
      "Don't rub or massage the treated area for 48 hours",
      "Small bumps settle within an hour; light bruising can last a few days",
      "Full result appears at day 14 — judge it then, not before"
    ]
  },
  {
    id: "wrinkle-three",
    category: "injectables",
    name: "Wrinkle Relaxing — Three Areas",
    price: 320,
    duration: 45,
    summary: "Forehead, frown and crow's feet treated together for a balanced result.",
    detail: "The most requested treatment in the clinic. Treating all three areas keeps movement even " +
            "across the upper face.",
    rebookWeeks: 12,
    prep: [
      "No alcohol for 24 hours before your appointment",
      "Avoid ibuprofen, aspirin and fish oil for 48 hours (unless prescribed)",
      "Come with a clean face — no make-up if possible"
    ],
    aftercare: [
      "Stay upright for 4 hours — no lying down or leaning forward",
      "No exercise, sauna or steam for 24 hours",
      "Don't rub or massage the treated area for 48 hours",
      "Small bumps settle within an hour; light bruising can last a few days",
      "Full result appears at day 14 — judge it then, not before"
    ]
  },
  {
    id: "lip-filler",
    category: "injectables",
    name: "Lip Enhancement",
    price: 290,
    duration: 45,
    summary: "0.5ml or 1ml of hyaluronic acid filler. Definition and hydration, in proportion.",
    detail: "I work conservatively and in stages. If you want a bigger change, we build to it across two " +
            "appointments rather than one.",
    rebookWeeks: 36,
    prep: [
      "No alcohol for 24 hours before your appointment",
      "Avoid ibuprofen, aspirin and fish oil for 48 hours (unless prescribed)",
      "Tell me in advance if you get cold sores — you may need antivirals first",
      "Eat beforehand and arrive hydrated"
    ],
    aftercare: [
      "Expect swelling for 24–72 hours — this is normal and settles",
      "Ice gently for 10 minutes at a time, wrapped in a cloth",
      "No exercise, alcohol, sauna or flying for 48 hours",
      "Sleep on your back with an extra pillow for two nights",
      "Avoid dental work for two weeks",
      "Final shape is visible at two weeks"
    ]
  },
  {
    id: "cheek-filler",
    category: "injectables",
    name: "Cheek & Midface Filler",
    price: 420,
    duration: 60,
    summary: "Structural support for flattened cheeks and early midface volume loss.",
    detail: "Placed deep on bone for lift rather than width. Often the treatment that makes tired faces " +
            "look rested without looking done.",
    rebookWeeks: 52,
    prep: [
      "No alcohol for 24 hours before your appointment",
      "Avoid ibuprofen, aspirin and fish oil for 48 hours (unless prescribed)",
      "Eat beforehand and arrive hydrated"
    ],
    aftercare: [
      "Expect swelling and possible bruising for up to a week",
      "No exercise, sauna or flying for 48 hours",
      "Sleep on your back for two nights",
      "Don't massage the area unless I've shown you how",
      "Book your two-week review before you leave"
    ]
  },

  /* ---------------- SKIN ---------------- */
  {
    id: "medical-facial",
    category: "skin",
    name: "Medical Facial",
    price: 130,
    duration: 60,
    summary: "Deep cleanse, gentle exfoliation and targeted actives. Zero downtime.",
    detail: "The maintenance appointment. Good before an event, good every six weeks, good for skin that " +
            "just looks dull.",
    rebookWeeks: 6,
    prep: [
      "Stop retinol and acids 3 days before",
      "Come without make-up if you can"
    ],
    aftercare: [
      "Skin may look pink for a few hours — this settles",
      "SPF 30+ every morning, without exception",
      "Restart retinol after 3 days",
      "No sauna, steam or heavy exercise for 24 hours"
    ]
  },
  {
    id: "chemical-peel",
    category: "skin",
    name: "Chemical Peel",
    price: 175,
    duration: 45,
    summary: "Medical-grade resurfacing for texture, pigmentation and congestion.",
    detail: "Strength is matched to your skin, not to a menu. Most people need a course of three, four " +
            "weeks apart.",
    rebookWeeks: 4,
    prep: [
      "Stop retinol, acids and exfoliants 5 days before",
      "No waxing, threading or laser for 2 weeks before",
      "Avoid sun exposure and sunbeds for 2 weeks before"
    ],
    aftercare: [
      "Peeling usually starts day 2–3 and lasts up to a week — don't pick it",
      "SPF 50 daily for two weeks, reapplied",
      "Bland moisturiser only for 5 days — no actives",
      "No exercise, sauna or swimming for 48 hours",
      "Avoid direct sun completely for two weeks"
    ]
  },
  {
    id: "microneedling",
    category: "skin",
    name: "Microneedling with Growth Factors",
    price: 220,
    duration: 75,
    summary: "Collagen induction for scarring, pores and fine lines.",
    detail: "Numbing cream is included in the appointment time. Best results come from three sessions " +
            "spaced a month apart.",
    rebookWeeks: 4,
    prep: [
      "Stop retinol and acids 5 days before",
      "No sun exposure or sunbeds for 2 weeks before",
      "Arrive with clean skin, no make-up"
    ],
    aftercare: [
      "Expect redness like mild sunburn for 24–48 hours",
      "Use only the aftercare products given to you for 72 hours",
      "SPF 50 daily for two weeks",
      "No make-up for 24 hours",
      "No exercise, sauna or swimming for 48 hours"
    ]
  },

  /* ---------------- ADVANCED ---------------- */
  {
    id: "polynucleotides",
    category: "advanced",
    name: "Polynucleotide Skin Boosters",
    price: 320,
    duration: 45,
    summary: "Regenerative injections for skin quality, under-eyes and crepey texture.",
    detail: "Not a filler — it improves the skin itself. A course of three, two to three weeks apart, " +
            "then twice a year.",
    rebookWeeks: 3,
    prep: [
      "No alcohol for 24 hours before",
      "Avoid blood thinners for 48 hours (unless prescribed)",
      "Arrive with clean skin"
    ],
    aftercare: [
      "Small bumps are normal and settle within 24 hours",
      "Bruising is common around the eyes — arnica helps",
      "No make-up for 12 hours",
      "No exercise, sauna or swimming for 24 hours",
      "SPF daily"
    ]
  },
  {
    id: "collagen-stimulator",
    category: "advanced",
    name: "Collagen Stimulator",
    price: 650,
    duration: 60,
    summary: "Gradual, natural-looking volume restoration over three to six months.",
    detail: "For people who want change nobody can point to. Usually two sessions, six weeks apart, " +
            "then a top-up every 12–18 months.",
    rebookWeeks: 48,
    prep: [
      "No alcohol for 24 hours before",
      "Avoid blood thinners for 48 hours (unless prescribed)",
      "Eat beforehand and arrive hydrated"
    ],
    aftercare: [
      "Massage the treated areas 5 minutes, 5 times a day, for 5 days",
      "Expect initial swelling that settles within a week",
      "No exercise, sauna or flying for 48 hours",
      "Results build slowly — assess at three months, not three weeks",
      "Book your six-week review before you leave"
    ]
  }
];

/* ---------- HELPERS ---------- */
const getTreatment = (id) => TREATMENTS.find(t => t.id === id);

const formatPrice = (t) =>
  t.priceLabel ? t.priceLabel : `£${t.price}`;

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};
