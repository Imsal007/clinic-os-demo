# Clinic OS

A website, booking system and automation engine for a solo aesthetics clinic.
Runs on a free Google account. No monthly software cost.

**Live demo:** https://imsal007.github.io/clinic-os-demo/

Built by [SAL Digital](https://saldigital.co).

---

## What it does

**Website** — hero, practitioner bio, full treatment menu with prices, clinic
photography, per-treatment aftercare, opening hours, floating WhatsApp button.

**Booking** — four-step modal (treatment → date → time → details + consent).
Availability is read live from Google Calendar, so a slot taken by phone or
walk-in disappears from the website automatically. Double-booking is blocked by
a re-check inside a lock at the moment of submission. A full day offers the
waitlist instead of a dead end.

**The engine** — fifteen automations, listed in `automations.js` and mirrored in
`Code.gs`. The website renders them from that file, so the page and the code
cannot drift apart.

---

## The automations

| | What fires it | Sold on its own |
|---|---|---|
| Confirmation and medical history | A booking is made | Ships with the booking system |
| No-show risk scoring | At booking, before the deposit question | ✓ |
| Patch test gate | A treatment that requires one | Ships with the booking system |
| Contraindication flagging | The medical history form comes back | ✓ |
| Preparation instructions | 48h before | Ships with the booking system |
| Reminders | 48h and 24h before | Ships with the booking system |
| **Waitlist auto-fill** | An appointment is cancelled | ✓ |
| Abandoned booking recovery | Someone leaves without confirming | ✓ |
| Consultation follow-up | 2, 5 and 10 days after a consultation | ✓ |
| Aftercare | The evening of the treatment | Ships with the booking system |
| Review request, routed and paced | 24h after | ✓ |
| Rebooking at the right week | When the treatment wears off | ✓ |
| Quiet week filler | Mondays, looking a week ahead | ✓ |
| Stock and expiry forecasting | Weekly, and on every booking | ✓ |
| Monthly report | The 1st | ✓ |

Ten of the fifteen install on their own, on top of whatever booking system a
clinic already runs. The other five need the diary underneath them.

### The three worth leading with

**Waitlist auto-fill.** When an appointment is cancelled the slot is released to
the waitlist in priority order — people waiting for that exact treatment first,
then that day, then anyone flexible. Each offer carries a claim link that
expires after twenty minutes, so the slot moves down the list on its own until
somebody takes it. A cancelled £420 appointment becomes a booked £420
appointment rather than an empty hour.

**No-show risk scoring.** Every booking is scored on lead time, whether the
client is new, the value, the slot, and whether that client has cancelled late
or failed to show before. Only bookings over the threshold are asked for a
deposit. A blanket deposit costs a clinic bookings from exactly the clients it
least wants to lose.

**Patch test gate.** A treatment that legally requires a patch test cannot be
booked without a valid one on file. This is a hard stop, not a reminder, and it
is an insurance question rather than a scheduling one.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | All styling. **Re-skin a client by changing only the tokens in `:root`** |
| `config.js` | **The only file you edit per client.** Name, contact, hours, images, forms, risk and commercial settings |
| `treatments.js` | Treatment menu — prices, durations, prep, aftercare, rebooking cycle |
| `automations.js` | The automation catalogue. Drives the engine section on the site and the table above |
| `app.js` | Front-end logic — menu, aftercare, booking flow, waitlist, the refill animation |
| `Code.gs` | Google Apps Script backend — availability, calendar, sheets, every automation |
| `seo-generate.js` | Programmatic SEO — one landing page per treatment × area |
| `find/` | Generated SEO pages (build output — regenerate, don't hand-edit) |
| `images/` | The clinic's own photography |
| `SETUP.md` | Deploying the backend, step by step |
| `ONBOARDING.md` | Taking a new clinic live |

### Sheets the backend creates

`firstRun()` creates five tabs: **Bookings**, **Waitlist**, **Leads**,
**Stock** and **Log**. Stock is seeded with the consumables the treatment menu
implies; fill in quantities and expiry dates and the forecast starts working.

### Triggers

| Trigger | Runs |
|---|---|
| `runHourly` | prep, reminders, aftercare, reviews, rebooking, waitlist offers, abandoned bookings, consultation follow-up |
| `runDaily` | stock forecast, quiet-week filler |
| `sendMonthlyReport` | the 1st of the month |

---

## Design

The demo skin is a deliberate move away from the default "luxury beauty" look —
cream ground, high-contrast serif, gold accent — because that combination now
reads as generated in this sector.

Instead the page is set as a **clinical monograph**: a pale, faintly cool paper,
Newsreader for display, IBM Plex Sans and Mono for everything operational, and a
petrol accent that is the complement of the amber in the clinic's own
photographs. Every figure — price, duration, interval, time — is set in the mono
face with tabular figures, so numbers line up in a column the way they do on a
chart.

The photographs are the only warm thing on the page, framed as plates.

There is one orchestrated animation (the hero entrance) and one demonstration
(the cancellation refilling itself). There is deliberately no scroll-triggered
fade on every section: it reads as a template, and it hides content from anyone
who lands mid-page.

**Re-skinning holds.** Every colour below `:root` is a token. The only hardcoded
values left in the stylesheet are WhatsApp's own brand greens, which are
annotated as such and must not be re-skinned.

---

## Programmatic SEO

```bash
node seo-generate.js --dry   # list what it would write
node seo-generate.js         # write pages + sitemap.xml + robots.txt
```

Reads `treatments.js` and the `seo` block in `config.js`. **Read the
thin-content warning at the top of the generator before adding more.** Fifty
pages that differ only by a place name is spam and Google treats it as such.

---

## Demo mode

Leave `CLINIC.booking.webAppUrl` empty in `config.js` and the site runs
standalone with realistic generated availability. Everything works and nothing
is saved. This is what you show on a sales call.

The first few open days are deliberately full, which is both true of a clinic
worth booking and what puts the waitlist in front of the visitor.

Paste the Apps Script `/exec` URL in and it becomes live.

### Showing fees

`CLINIC.commercial.showFees` puts a one-off build price next to every module
that can be sold on its own. Leave it **on** for a pitch; turn it **off** for a
live clinic site, where a client's visitors should never see what the clinic
paid for the build.

---

## Cost

| | Clinic OS | Fresha | Pabau |
|---|---|---|---|
| Monthly | £0 | £14.95 + 20% marketplace commission | ~£199 |
| Hosting | £0 (GitHub Pages) | — | — |
| Booking limit | Google Apps Script quotas (~100 emails/day on a free account) | — | — |

On a £300 treatment, Fresha's marketplace commission is £60. Here it is £0.

**The quota matters now.** With fifteen automations running, a busy clinic can
approach the free Gmail limit of roughly 100 emails a day. A Workspace account
raises it to 1,500. Check `Log` if messages stop.

---

## Before a clinic goes live

**Imagery.** The photographs in `images/` are treatment photography, not
before-and-after comparisons, and the site labels them as such. Replace them
with the clinic's own consented before-and-after work before switching
`galleryIsPlaceholder` to `false`. UK advertising rules on cosmetic procedures
are strict about this — see `ONBOARDING.md`.

**Proof.** There are deliberately no testimonials and no review count on this
site. `reviews.rating` and `reviews.count` are `null` on purpose — never invent
them.

**Deposits.** `CONFIG.risk.depositUrl` in `Code.gs` is a placeholder. Point it at
a real Stripe payment link before switching risk scoring on, and tune
`depositAt` against a couple of months of real data rather than trusting the
default.

**Contraindication flags are not clinical advice.** `CONFIG.flagTerms` surfaces
what a client wrote so the practitioner reads it before the appointment. It
never refuses a booking and it never replaces her judgement.
