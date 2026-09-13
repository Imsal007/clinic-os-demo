# Taking a new clinic live

Target: under two hours from signed to live.

---

## What to collect on the call

- Clinic name, and how they want it written
- Practitioner name, qualifications, and how they describe what they do
- Address, phone, WhatsApp number, email
- Opening hours
- Treatment list with prices and appointment lengths
- Google Business Profile review link
- Instagram
- Photos: one hero, one of the practitioner, and their before-and-after set

---

## The build

1. **Copy the repo.** Rename to `clinic-<name>`.
2. **Edit `config.js` only.** Everything on the page reads from it — name,
   contact, hours, images, form links, review link, policy wording.
3. **Edit `treatments.js`.** Their menu, their prices, their durations.
   `rebookWeeks` on each treatment is what drives the rebooking nudge — get it
   right or the nudges land at the wrong time.
4. **Mirror both into `CONFIG` in `Code.gs`.** The treatment IDs must match
   `treatments.js` exactly or the prep and aftercare emails fall back to generic.
5. Follow `SETUP.md` on **their** Google account, not yours. They own their
   data; you should be able to hand the whole thing over and walk away.
6. **GitHub Pages on**, then point their domain at it if they have one.

---

## Photography — read this before you publish

The results gallery is the part that sells the clinic, and it is also the part
that can get them into trouble.

- Use **their own** before-and-after photographs. Not stock, not AI-generated,
  not another clinic's.
- Get **written consent** for each image, on file, naming the website
  specifically. Verbal is not enough.
- Same lighting, same angle, same distance, no make-up in either shot. A
  flattering "after" taken in better light is misleading even when the
  treatment worked.
- No retouching or filters of any kind.
- Then set `galleryIsPlaceholder: false` in `config.js`.

Until that is done, leave it `true` — the section relabels itself honestly and
nothing on the page claims to be a client result.

UK advertising rules on cosmetic procedures are enforced, and prescription
treatments in particular cannot be advertised the way a facial can. If a clinic
is unsure what they can show or say, that is a question for their insurer or
professional body, not for us. Say so plainly rather than guessing for them —
it is their registration on the line.

---

## Handover

Give them:

- The live URL
- Edit access to their Bookings sheet
- The two Google Form links
- A one-page note: how to block out holiday (put an event in Google Calendar —
  the website stops offering those slots automatically), how to mark a no-show
  (change `Status` to `No-show`, which feeds the monthly report), and how to
  change a price (one line in `treatments.js`, or ask us)

Then send a test booking through in front of them so they watch the email land.
That is the moment they understand what they bought.

---

## What to charge

One-off build, plus a monthly retainer for changes, new treatments, seasonal
campaigns and keeping the automations healthy. The retainer is easy to justify
because there is no software bill underneath it — a clinic paying Fresha's
marketplace commission on a single £300 treatment is already paying more than a
month of your time.

Price the build against what a no-show costs them. A clinic losing two £300
appointments a month to forgetfulness is losing £7,200 a year; reminders alone
pay for the site several times over.
