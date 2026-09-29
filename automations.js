/* ============================================================
   CLINIC OS — AUTOMATION CATALOGUE
   ------------------------------------------------------------
   The single source of truth for what the engine does.

   Used by:
     · app.js      — renders the "engine" section on the website
     · Code.gs     — mirrors these triggers in the Apps Script backend
     · README.md   — the table of automations

   Each entry is written so a clinic owner understands it without
   being told what a webhook is. `payoff` states the mechanism —
   never a statistic we cannot stand behind.

   Fields
     needs       — what has to exist for it to run
     payoff      — how it helps, as a mechanism
     standalone  — can be sold and installed on its own, on top of
                   whatever booking system the clinic already runs
     fee         — indicative one-off build price. SET YOUR OWN.
                   Shown on the site only when `commercial.showFees`
                   is true in config.js — leave it false for a
                   client-facing site.
   ============================================================ */

const AUTOMATION_GROUPS = [
  { id: "book",   label: "When someone books",   note: "Everything between tapping Confirm and sitting in the chair" },
  { id: "change", label: "When plans change",    note: "Cancellations, gaps and people who nearly booked" },
  { id: "after",  label: "After the treatment",  note: "Aftercare, reviews and the next appointment" },
  { id: "run",    label: "Running the clinic",   note: "Stock, quiet weeks and the numbers each month" }
];

const AUTOMATIONS = [

  /* ---------------- WHEN SOMEONE BOOKS ---------------- */
  {
    id: "confirm",
    standalone: false,
    fee: null,
    standaloneNote: "Part of the booking system — needs the diary to exist first.",
    needs: ["Google Calendar", "Gmail", "A medical history form"],
    group: "book",
    name: "Confirmation and medical history",
    when: "The moment a booking is made",
    does: "Sends the client their confirmation and the medical history and consent form, and drops the " +
          "appointment straight into the clinic calendar. The practitioner gets a separate alert with a " +
          "one-tap WhatsApp link to the client.",
    payoff: "The form is completed before the appointment instead of on a clipboard in the waiting room.",
    live: true
  },
  {
    id: "risk",
    standalone: true,
    fee: "£450",
    standaloneNote: "Sits on top of any booking system that records a client history.",
    needs: ["Booking history in the sheet", "A deposit link — Stripe or bank transfer"],
    group: "book",
    name: "No-show risk scoring",
    when: "At the moment of booking, before the deposit question",
    does: "Scores the booking on how far ahead it was made, whether the client is new, how much the " +
          "appointment is worth, whether it sits in a late or weekend slot, and whether that client has " +
          "cancelled late before. Only bookings over the threshold are asked for a deposit.",
    payoff: "A blanket deposit costs you bookings from good clients. This asks the ones who need asking.",
    live: true,
    demo: "Book a high-value treatment far ahead as a new client and the deposit step appears. Book a " +
          "consultation next week and it does not."
  },
  {
    id: "patch",
    standalone: false,
    fee: null,
    standaloneNote: "Has to live inside the booking flow to block a booking.",
    needs: ["A patch test record per client", "Patch test marked on the treatments that need one"],
    group: "book",
    name: "Patch test gate",
    when: "Before a peel or a treatment that requires one",
    does: "Checks whether a valid patch test is on file and inside its window. If there is not one, the " +
          "booking cannot complete — the client is offered a patch test appointment first, and the " +
          "treatment slot is held for them.",
    payoff: "A treatment given without a required patch test is an insurance problem, not a scheduling one.",
    live: true,
    demo: "Choose a chemical peel as a new client and watch the flow redirect to a patch test."
  },
  {
    id: "flags",
    standalone: true,
    fee: "£350",
    standaloneNote: "Reads the intake form. Works with Jotform, Google Forms or Typeform.",
    needs: ["The medical history form answers", "A list of flag terms to watch for"],
    group: "book",
    name: "Contraindication flagging",
    when: "As soon as the medical history form comes back",
    does: "Reads the answers for anticoagulants, pregnancy and breastfeeding, recent vaccination, " +
          "autoimmune conditions, active skin infection and known allergies, then flags anything found to " +
          "the practitioner with the appointment attached.",
    payoff: "The practitioner knows before she walks into the room, not while the needle is in her hand.",
    live: true
  },
  {
    id: "prep",
    standalone: false,
    fee: null,
    standaloneNote: "Part of the booking system — fires off the appointment record.",
    needs: ["Prep text per treatment", "Gmail"],
    group: "book",
    name: "Preparation instructions",
    when: "48 hours before the appointment",
    does: "Sends the prep specific to that treatment — stop retinol five days before a peel, no alcohol " +
          "for 24 hours before injectables, arrive having eaten.",
    payoff: "Clients who prepare properly bruise less, and a client who bruises less rebooks.",
    live: true
  },
  {
    id: "remind",
    standalone: false,
    fee: null,
    standaloneNote: "Part of the booking system — fires off the appointment record.",
    needs: ["Gmail", "A reschedule link"],
    group: "book",
    name: "Reminders",
    when: "48 hours and again 24 hours before",
    does: "Two reminders with the date, the time, the address and a link to move the appointment rather " +
          "than abandon it.",
    payoff: "Most no-shows are forgetfulness, and a reschedule keeps the revenue.",
    live: true
  },

  /* ---------------- WHEN PLANS CHANGE ---------------- */
  {
    id: "waitlist",
    standalone: true,
    fee: "£650",
    standaloneNote: "The strongest one to sell alone. Needs only a cancellation to react to.",
    needs: ["A waitlist sheet", "Gmail or WhatsApp", "A claim link that expires"],
    group: "change",
    name: "Waitlist auto-fill",
    when: "The second an appointment is cancelled",
    does: "Messages the waitlist in priority order — clients waiting for that exact treatment first, then " +
          "that day, then anyone flexible. Each is given a claim link that expires, so the slot moves down " +
          "the list on its own until somebody takes it.",
    payoff: "A cancelled £420 appointment becomes a booked £420 appointment instead of an empty hour.",
    live: true,
    headline: true,
    demo: "Pick a fully booked day on the calendar and the waitlist form appears in place of the slots."
  },
  {
    id: "abandoned",
    standalone: true,
    fee: "£400",
    standaloneNote: "Needs the booking page to capture an email one step earlier.",
    needs: ["Email captured before the final step", "Gmail"],
    group: "change",
    name: "Abandoned booking recovery",
    when: "When someone picks a treatment and a time, then leaves without confirming",
    does: "Holds the treatment, date and time they had chosen and follows up once with that exact slot " +
          "still available, then once more a few days later with the next two openings.",
    payoff: "Aesthetics is a considered purchase. People leave to think about it and never come back on their own.",
    live: true
  },
  {
    id: "consult",
    standalone: true,
    fee: "£400",
    standaloneNote: "Needs consultations marked in whatever diary the clinic already keeps.",
    needs: ["Consultations marked in the sheet", "The plan and price from the room"],
    group: "change",
    name: "Consultation follow-up",
    when: "Two days, five days and ten days after a consultation with no treatment booked",
    does: "A short sequence carrying the written plan discussed in the room, the price quoted, and the " +
          "next available appointments for that specific treatment.",
    payoff: "The consultation is already paid for in chair time. This is where that time turns into revenue.",
    live: true
  },

  /* ---------------- AFTER THE TREATMENT ---------------- */
  {
    id: "aftercare",
    standalone: false,
    fee: null,
    standaloneNote: "Part of the booking system — fires off the appointment record.",
    needs: ["Aftercare text per treatment", "Gmail"],
    group: "after",
    name: "Aftercare",
    when: "The evening of the treatment",
    does: "Sends the aftercare for that specific treatment — massage five times a day for five days after " +
          "a collagen stimulator, sleep on your back for two nights after lip filler.",
    payoff: "Aftercare sent at the moment it matters is read. A printed sheet is left in the car.",
    live: true
  },
  {
    id: "review",
    standalone: true,
    fee: "£350",
    standaloneNote: "Fully standalone. Works from a finished-appointment list alone.",
    needs: ["A Google review link", "A private feedback form"],
    group: "after",
    name: "Review request, routed and paced",
    when: "24 hours after the treatment",
    does: "Asks one question. A happy answer goes to the public Google review page. An unhappy answer goes " +
          "to a private form that reaches the practitioner only. Requests are spaced out across the week " +
          "rather than sent in a batch.",
    payoff: "Complaints reach you before they reach Google, and a burst of reviews in one day looks bought.",
    live: true
  },
  {
    id: "rebook",
    standalone: true,
    fee: "£450",
    standaloneNote: "Fully standalone. Works from past appointment dates alone.",
    needs: ["A rebooking cycle per treatment", "Past appointment dates per client"],
    group: "after",
    name: "Rebooking at the right week",
    when: "At the point that treatment actually wears off",
    does: "Counts forward by the cycle for that treatment — twelve weeks for wrinkle relaxing, four for a " +
          "peel, a year for cheek filler — and adjusts using the interval that client has actually kept to " +
          "in the past, rather than the textbook number.",
    payoff: "Asking at week twelve rebooks. Asking at week twenty finds they went somewhere else at week fourteen.",
    live: true
  },

  /* ---------------- RUNNING THE CLINIC ---------------- */
  {
    id: "quiet",
    standalone: true,
    fee: "£400",
    standaloneNote: "Needs read access to the diary and a client list with last-visit dates.",
    needs: ["The diary for the week ahead", "Clients with a last-visit date"],
    group: "run",
    name: "Quiet week filler",
    when: "Every Monday, looking at the seven days ahead",
    does: "If the week is under-booked, releases that week's remaining appointments to clients who have not " +
          "been in for a while — closest first, and only as many as there are slots to fill.",
    payoff: "Demand gets smoothed towards the empty days instead of a discount going out to everybody.",
    live: true
  },
  {
    id: "stock",
    standalone: true,
    fee: "£500",
    standaloneNote: "Fully standalone. Runs off the diary and a stock sheet.",
    needs: ["What each treatment consumes", "Stock levels and expiry dates"],
    group: "run",
    name: "Stock and expiry forecasting",
    when: "Weekly, and whenever a booking is made",
    does: "Works out what will be used from the appointments already in the diary, compares it against what " +
          "is on the shelf and when it expires, and warns before product runs short or goes out of date.",
    payoff: "Toxin and filler have shelf lives. Product thrown away unopened is money already spent.",
    live: true
  },
  {
    id: "report",
    standalone: true,
    fee: "£300",
    standaloneNote: "Fully standalone. Reads a sheet and sends an email.",
    needs: ["The bookings sheet", "Nothing else"],
    group: "run",
    name: "Monthly report",
    when: "The first of every month",
    does: "Appointments, revenue, the no-show rate, how many slots the waitlist refilled, reviews left, " +
          "rebookings made, and revenue per hour broken down by treatment.",
    payoff: "Revenue per chair-hour is what tells you which treatments to keep on the menu.",
    live: true
  }
];

/* Convenience lookups used by app.js */
const automationsIn = (groupId) => AUTOMATIONS.filter(a => a.group === groupId);
const automationById = (id) => AUTOMATIONS.find(a => a.id === id);
