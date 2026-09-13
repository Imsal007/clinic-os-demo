# Clinic OS

A website, booking system and follow-up engine for a solo aesthetics clinic.
Runs on a free Google account. No monthly software cost.

**Live demo:** https://imsal007.github.io/clinic-os-demo/

Built by [SAL Digital](https://saldigital.co).

---

## What it does

**Website** — hero, practitioner bio, full treatment menu with prices, results
gallery, reviews, per-treatment aftercare, opening hours, floating WhatsApp button.

**Booking** — four-step modal (treatment → date → time → details + consent).
Availability is read live from Google Calendar, so a slot taken by phone or
walk-in disappears from the website automatically. Double-booking is blocked by
a re-check inside a lock at the moment of submission.

**Follow-up, automatic** —

| When | What goes out |
|---|---|
| On booking | Confirmation email + medical history / consent form link |
| On booking | Owner alert with a one-tap WhatsApp link to the client |
| 48h before | Prep instructions, specific to the treatment |
| 48h before | Reminder |
| 24h before | Reminder |
| Evening after | Aftercare, specific to the treatment |
| 24h after | Review request — happy → Google, unhappy → private form |
| At the treatment cycle | Rebooking nudge (12 weeks for wrinkle relaxing, 4 for peels, etc.) |
| 1st of the month | Owner report: appointments, revenue, no-show rate, reviews, rebookings |

---

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | All styling, on the SAL brand system (gold on near-black). **Re-skin a client by changing only the tokens in `:root`** — nothing below it hard-codes a colour |
| `config.js` | **The only file you edit per client.** Name, contact, hours, images, form links |
| `treatments.js` | Treatment menu — prices, durations, prep, aftercare, rebooking cycle |
| `app.js` | Front-end logic — menu, aftercare accordion, booking flow |
| `Code.gs` | Google Apps Script backend — availability, calendar, sheet, all emails |
| `seo-generate.js` | Programmatic SEO — builds one landing page per treatment × area, plus sitemap and robots |
| `find/` | The generated SEO pages (build output — regenerate, don't hand-edit) |
| `SETUP.md` | Deploying the backend, step by step |
| `ONBOARDING.md` | Taking a new clinic live |

---

## Programmatic SEO

```bash
node seo-generate.js --dry   # list what it would write
node seo-generate.js         # write pages + sitemap.xml + robots.txt
```

Reads `treatments.js` and the `seo` block in `config.js`, and writes one page
per treatment × area — each with its own title, meta description, canonical,
`MedicalBusiness` JSON-LD carrying the right area and price, and the
treatment's real prep and aftercare content. Prices stay correct because they
come from the same data the booking flow uses.

Currently four treatments × four areas. **Read the thin-content warning at the
top of the generator before adding more.** Fifty pages that differ only by a
place name is spam and Google treats it as such; every area needs real
hand-written `blurb` and `travel` copy.

Then submit `/sitemap.xml` in Google Search Console.

---

## Demo mode

Leave `CLINIC.booking.webAppUrl` empty in `config.js` and the site runs
standalone with realistic generated availability. Everything works and nothing
is saved. This is what you show on a sales call.

Paste the Apps Script `/exec` URL in and it becomes live.

---

## Cost

| | Clinic OS | Fresha | Pabau |
|---|---|---|---|
| Monthly | £0 | £14.95 + 20% marketplace commission | ~£199 |
| Hosting | £0 (GitHub Pages) | — | — |
| Booking limit | Google Apps Script quotas (~100 emails/day on a free account) | — | — |

On a £300 treatment, Fresha's marketplace commission is £60. Here it is £0.

---

## Before a clinic goes live

**Imagery.** The results gallery ships with stock photography and is labelled as
placeholder in the demo. Replace it with the clinic's own before-and-after
photographs, taken with written consent, before switching
`galleryIsPlaceholder` to `false`. UK advertising rules on cosmetic procedures
are strict about this — see `ONBOARDING.md`.

**Proof.** There are deliberately no testimonials and no review count on this
site. The "Why us" section carries structural promises the clinic actually
makes instead. `reviews.rating` and `reviews.count` are `null` on purpose —
never invent them. Add real reviews only once they exist.
