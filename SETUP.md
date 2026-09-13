# Setup

About 30 minutes end to end. Do it once on `saldigitalm@gmail.com` for the demo,
then repeat per client on their own Google account.

---

## 1 · Google Sheet + Apps Script

1. Go to [sheets.new](https://sheets.new). Name it **Clinic OS — Bookings**.
2. **Extensions → Apps Script**. Delete the placeholder `myFunction`.
3. Paste in the whole of `Code.gs`.
4. Edit the `CONFIG` block at the top — clinic name, owner email, phone,
   WhatsApp number, address, website URL.
5. Save (⌘S / Ctrl+S).

## 2 · First run

1. In the function dropdown pick **`firstRun`**, press **Run**.
2. Google will ask for permission. Choose the account, then
   **Advanced → Go to (project name) → Allow**.
   The "unverified app" warning is expected — it is your own script.
3. It creates the `Bookings` and `Log` tabs and installs two triggers
   (hourly, and monthly on the 1st).

## 3 · The two Google Forms

**Medical history & consent** — [forms.new](https://forms.new)

Ask for: full name, date of birth, email, mobile, GP details, current
medications, allergies, medical conditions, previous aesthetic treatments,
pregnancy/breastfeeding, and a consent tick-box. Set **Responses → Link to
Sheets** so answers land in a spreadsheet.

**Private feedback** — a second short form: "What could have been better?"
free text, plus an optional contact field. This is where the unhappy half of
the review request goes, so it never becomes a public one-star.

Copy both share links into `CONFIG` in `Code.gs` **and** into `config.js`
on the website.

## 4 · Deploy the web app

1. In Apps Script: **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
4. **Deploy**, then copy the `/exec` URL.

> Anyone with the URL can read availability and create a booking. That is the
> point — it is the booking endpoint. It exposes no client data.

## 5 · Connect the website

In `config.js`:

```js
booking: {
  webAppUrl: "https://script.google.com/macros/s/AKfy…/exec",
  …
}
```

Commit. GitHub Pages redeploys in about a minute. The site is now live —
demo mode switches itself off as soon as that URL is present.

## 6 · Turn on GitHub Pages

Repo **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
Live at `https://<user>.github.io/<repo>/`.

---

## Testing it works

1. Open the site, book the earliest available slot with your own email.
2. Check: confirmation email arrives, row appears in the `Bookings` tab,
   event appears in Google Calendar.
3. Reload the site and pick the same date — that slot should be gone.
4. In Apps Script, run `runHourly` manually. Nothing should send for a booking
   that is more than 72 hours away; that is correct.

To test the follow-up emails without waiting, edit a row's date in the sheet to
tomorrow and run `runHourly` again.

---

## Quotas (free Google account)

- **100 emails/day.** A clinic doing 40 appointments a month sends roughly
  7 emails per booking — about 280 a month. Comfortable.
- **90 minutes/day of script runtime.** The hourly job takes seconds.
- A Workspace account raises the email limit to 1,500/day if a clinic outgrows it.

---

## Making the demo look lived-in

Run `seedDemoBookings` once in Apps Script. It writes 20 plausible past
bookings across the last ten weeks, so the sheet and the monthly report have
something real in them on a sales call. Delete those rows before a client
goes live.
