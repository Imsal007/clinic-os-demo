/* ============================================================
   CLINIC OS — CONFIGURATION
   ------------------------------------------------------------
   This is the ONLY file you edit when onboarding a new clinic.
   Change these values and the whole site updates itself.
   ============================================================ */

const CLINIC = {

  /* ---------- IDENTITY ---------- */
  name:        "Aurelia Aesthetics",
  shortName:   "Aurelia",
  tagline:     "Quiet, considered aesthetics",
  strapline:   "Subtle results from a practitioner who says no more often than yes.",
  location:    "Shoreditch, London",

  /* ---------- PRACTITIONER ---------- */
  practitioner: {
    name:        "Dr. Elena Marsh",
    title:       "Aesthetic Practitioner",
    credentials: "MBBS · GMC Registered · Level 7 Aesthetics",
    bio: "I trained in medicine before I trained in aesthetics, and that order still shapes how I work. " +
         "Most people who sit in my chair don't want to look different — they want to look like themselves " +
         "on a good day. So we start with a conversation, not a price list. If a treatment isn't right for " +
         "you, I'll tell you, even when it costs me the booking.",
    yearsExperience: 11,
    treatmentsPerformed: "4,000+"
  },

  /* ---------- CONTACT ---------- */
  contact: {
    phone:    "+44 20 7946 0812",
    whatsapp: "447946080812",              // digits only, country code, no +
    email:    "hello@aureliaaesthetics.co.uk",
    address:  "14 Redchurch Street",
    city:     "London",
    postcode: "E2 7DJ",
    mapsUrl:  "https://maps.google.com/?q=Redchurch+Street+London"
  },

  /* ---------- OPENING HOURS ----------
     0 = Sunday … 6 = Saturday. null = closed.        */
  hours: {
    0: null,
    1: { open: "10:00", close: "18:00" },
    2: { open: "10:00", close: "19:00" },
    3: { open: "10:00", close: "19:00" },
    4: { open: "10:00", close: "20:00" },
    5: { open: "10:00", close: "18:00" },
    6: { open: "09:00", close: "16:00" }
  },

  /* ---------- BOOKING ENGINE ---------- */
  booking: {
    // Paste your Apps Script Web App URL here after deploying Code.gs.
    // Leave as "" to run the site in DEMO MODE (fake but realistic availability).
    webAppUrl: "",

    slotMinutes:      15,   // granularity of the time grid
    bufferMinutes:    15,   // gap left after every appointment
    minNoticeHours:   24,   // earliest a client can book from now
    maxDaysAhead:     60,   // how far ahead the calendar opens
    maxPerDay:        6     // safety cap on bookings per day
  },

  /* ---------- FORMS ----------
     Create these two Google Forms, then paste the share links here. */
  forms: {
    medicalHistory: "https://forms.gle/REPLACE_ME_MEDICAL",
    privateFeedback: "https://forms.gle/REPLACE_ME_FEEDBACK"
  },

  /* ---------- REVIEWS ---------- */
  reviews: {
    googleReviewUrl: "https://g.page/r/REPLACE_ME/review",
    rating: 4.9,
    count: 187
  },

  /* ---------- SOCIAL ---------- */
  social: {
    instagram: "https://instagram.com/aureliaaesthetics",
    tiktok:    ""
  },

  /* ---------- WHATSAPP WIDGET ----------
     Contextual chat bubble. The message changes with the section the visitor
     is reading, and with the treatment they last opened.                    */
  chat: {
    enabled:     true,
    replyTime:   "Typically replies within minutes",
    autoOpenAfter: 14,        // seconds. 0 = never auto-open.
    onlineLabel: "Online",

    // Section id → the prompt shown in the bubble.
    prompts: {
      top:        "Hi 👋 Anything you'd like to ask before booking?",
      about:      "Any questions for Dr. Marsh before you book?",
      treatments: "Not sure which treatment is right for you?",
      results:    "Want to see more results for a specific treatment?",
      reviews:    "Happy to put you in touch with a past client.",
      aftercare:  "Question about prep or aftercare? Ask away.",
      visit:      "Need directions, parking or a different time?"
    },
    // Used when the visitor has opened a specific treatment in the booking modal.
    treatmentPrompt: "Questions about {treatment}?"
  },

  /* ---------- IMAGERY ----------
     Swap any of these for the clinic's own photos.
     Drop files into an /images folder and use "images/hero.jpg" etc.
     The four gallery shots MUST be replaced with real, consented client
     photos before this goes live for a clinic — see ONBOARDING.md.     */
  images: {
    hero:         "https://images.unsplash.com/photo-1731514721772-329626f84c8b?w=1000&h=1250&fit=crop&q=80&auto=format",
    practitioner: "https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=900&h=1200&fit=crop&q=80&auto=format",
    gallery: [
      { src: "https://images.unsplash.com/photo-1643684391140-c5056cfd3436?w=600&h=800&fit=crop&q=80&auto=format", tag: "Wrinkle relaxing" },
      { src: "https://images.unsplash.com/photo-1551184451-76b762941ad6?w=600&h=800&fit=crop&q=80&auto=format",    tag: "Lip enhancement" },
      { src: "https://images.unsplash.com/photo-1605769574581-b2511b6afa08?w=600&h=800&fit=crop&q=80&auto=format", tag: "Skin boosters" },
      { src: "https://images.unsplash.com/photo-1693004927824-f2623bbedc8b?w=600&h=800&fit=crop&q=80&auto=format", tag: "Peel course" }
    ],
    // true  = gallery is stock/placeholder, shown with an honest caption
    // false = these are the clinic's own consented before/after photos
    galleryIsPlaceholder: true
  },

  /* ---------- POLICY COPY ---------- */
  policy: {
    cancellation: "Please give at least 48 hours' notice to change or cancel. " +
                  "Late cancellations and no-shows may affect future bookings.",
    payment:      "Payment is taken in clinic on the day — card, cash or bank transfer.",
    consultation: "Every first appointment includes a full consultation. " +
                  "If treatment isn't appropriate for you, there is no charge."
  }
};

/* ---------- DERIVED HELPERS (don't edit) ---------- */
CLINIC.whatsappLink = (msg) =>
  `https://wa.me/${CLINIC.contact.whatsapp}?text=${encodeURIComponent(msg || "Hi, I'd like to ask about a treatment.")}`;

CLINIC.isDemoMode = () => !CLINIC.booking.webAppUrl;
