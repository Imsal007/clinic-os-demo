/* ============================================================
   CLINIC OS — GOOGLE APPS SCRIPT BACKEND
   ------------------------------------------------------------
   One file. Runs the whole booking + follow-up engine on a
   free Google account. No monthly cost, no third-party SaaS.

   WHAT IT DOES
     · Serves live availability to the website
     · Writes bookings to a Google Sheet + Google Calendar
     · Sends confirmation, prep, reminder, aftercare, review
       and rebooking emails on a schedule
     · Emails the owner a monthly performance report

   SETUP — see SETUP.md. Short version:
     1. Create a Google Sheet, Extensions > Apps Script
     2. Paste this file in, fill in CONFIG below
     3. Run `firstRun` once and grant permissions
     4. Deploy > New deployment > Web app
          Execute as: Me      Who has access: Anyone
     5. Paste the /exec URL into config.js on the website
   ============================================================ */

/* ============================================================
   CONFIG — edit this block only
   ============================================================ */
const CONFIG = {
  clinicName:      'Aurelia Aesthetics',
  practitioner:    'Dr. Elena Marsh',
  ownerEmail:      'saldigitalm@gmail.com',      // where alerts + reports go
  replyTo:         'saldigitalm@gmail.com',
  phone:           '+44 20 7946 0812',
  whatsapp:        '447946080812',
  address:         '14 Redchurch Street, London E2 7DJ',
  websiteUrl:      'https://imsal007.github.io/clinic-os-demo/',
  timezone:        'Europe/London',

  calendarId:      'primary',                    // or a dedicated calendar ID

  medicalFormUrl:  'https://forms.gle/REPLACE_ME_MEDICAL',
  feedbackFormUrl: 'https://forms.gle/REPLACE_ME_FEEDBACK',
  googleReviewUrl: 'https://g.page/r/REPLACE_ME/review',

  bufferMinutes:   15,
  maxPerDay:       6,

  // Opening hours, 0 = Sunday. null = closed.
  hours: {
    0: null,
    1: { open: '10:00', close: '18:00' },
    2: { open: '10:00', close: '19:00' },
    3: { open: '10:00', close: '19:00' },
    4: { open: '10:00', close: '20:00' },
    5: { open: '10:00', close: '18:00' },
    6: { open: '09:00', close: '16:00' }
  },

  // Must mirror treatments.js on the website.
  treatments: {
    'consultation':         { name: 'Consultation',                      price: 0,   rebookWeeks: null },
    'wrinkle-one':          { name: 'Wrinkle Relaxing — One Area',       price: 180, rebookWeeks: 12 },
    'wrinkle-three':        { name: 'Wrinkle Relaxing — Three Areas',    price: 320, rebookWeeks: 12 },
    'lip-filler':           { name: 'Lip Enhancement',                   price: 290, rebookWeeks: 36 },
    'cheek-filler':         { name: 'Cheek & Midface Filler',            price: 420, rebookWeeks: 52 },
    'medical-facial':       { name: 'Medical Facial',                    price: 130, rebookWeeks: 6 },
    'chemical-peel':        { name: 'Chemical Peel',                     price: 175, rebookWeeks: 4 },
    'microneedling':        { name: 'Microneedling with Growth Factors', price: 220, rebookWeeks: 4 },
    'polynucleotides':      { name: 'Polynucleotide Skin Boosters',      price: 320, rebookWeeks: 3 },
    'collagen-stimulator':  { name: 'Collagen Stimulator',               price: 650, rebookWeeks: 48 }
  },

  // Per-treatment prep and aftercare. Falls back to GENERIC.
  prep: {
    'wrinkle-one':     ['No alcohol for 24 hours before', 'Avoid ibuprofen, aspirin and fish oil for 48 hours unless prescribed', 'Come with a clean face'],
    'wrinkle-three':   ['No alcohol for 24 hours before', 'Avoid ibuprofen, aspirin and fish oil for 48 hours unless prescribed', 'Come with a clean face'],
    'lip-filler':      ['No alcohol for 24 hours before', 'Avoid blood thinners for 48 hours unless prescribed', 'Tell us in advance if you get cold sores', 'Eat beforehand and arrive hydrated'],
    'cheek-filler':    ['No alcohol for 24 hours before', 'Avoid blood thinners for 48 hours unless prescribed', 'Eat beforehand and arrive hydrated'],
    'chemical-peel':   ['Stop retinol, acids and exfoliants 5 days before', 'No waxing or laser for 2 weeks before', 'Avoid sun exposure for 2 weeks before'],
    'microneedling':   ['Stop retinol and acids 5 days before', 'No sun exposure for 2 weeks before', 'Arrive with clean skin'],
    'medical-facial':  ['Stop retinol and acids 3 days before', 'Come without make-up if you can'],
    'polynucleotides': ['No alcohol for 24 hours before', 'Avoid blood thinners for 48 hours unless prescribed', 'Arrive with clean skin'],
    'collagen-stimulator': ['No alcohol for 24 hours before', 'Avoid blood thinners for 48 hours unless prescribed', 'Eat beforehand and arrive hydrated']
  },
  aftercare: {
    'wrinkle-one':   ['Stay upright for 4 hours', 'No exercise, sauna or steam for 24 hours', 'Do not rub the area for 48 hours', 'Full result appears at day 14'],
    'wrinkle-three': ['Stay upright for 4 hours', 'No exercise, sauna or steam for 24 hours', 'Do not rub the area for 48 hours', 'Full result appears at day 14'],
    'lip-filler':    ['Swelling for 24–72 hours is normal', 'Ice gently, wrapped in a cloth', 'No exercise, alcohol or flying for 48 hours', 'Sleep on your back for two nights', 'Avoid dental work for two weeks'],
    'cheek-filler':  ['Swelling and bruising can last a week', 'No exercise, sauna or flying for 48 hours', 'Sleep on your back for two nights', 'Book your two-week review'],
    'chemical-peel': ['Peeling starts day 2–3 — do not pick it', 'SPF 50 daily for two weeks', 'Bland moisturiser only for 5 days', 'No exercise or swimming for 48 hours'],
    'microneedling': ['Redness like mild sunburn for 24–48 hours', 'Use only the aftercare products given to you for 72 hours', 'SPF 50 daily for two weeks', 'No make-up for 24 hours'],
    'medical-facial':['Skin may look pink for a few hours', 'SPF 30+ every morning', 'Restart retinol after 3 days'],
    'polynucleotides':['Small bumps settle within 24 hours', 'Bruising around the eyes is common', 'No make-up for 12 hours', 'SPF daily'],
    'collagen-stimulator':['Massage 5 minutes, 5 times a day, for 5 days', 'Swelling settles within a week', 'No exercise or flying for 48 hours', 'Assess results at three months']
  },
  GENERIC_AFTERCARE: ['Avoid heat, exercise and alcohol for 24 hours', 'Keep the area clean', 'SPF daily', 'Message us if anything worries you'],

  /* ---------- WAITLIST ----------
     How long a person has to claim a released slot before it passes
     to the next one down the list. Short enough that the slot keeps
     moving, long enough that somebody at work can answer.          */
  waitlist: {
    claimMinutes: 20,
    maxOffersPerSlot: 6        // give up after this many and alert the owner
  },

  /* ---------- NO-SHOW RISK ----------
     Points are added up per booking. At or above `depositAt`, the
     client is asked for a deposit; everybody else is not. Tune the
     threshold on real data after a couple of months.               */
  risk: {
    depositAt:        5,
    depositPercent:   25,
    depositUrl:       'https://buy.stripe.com/REPLACE_ME',
    points: {
      newClient:        2,   // no previous completed appointment
      bookedOver21Days: 2,   // made a long way ahead
      highValue:        1,   // price at or above `highValueFrom`
      lateSlot:         1,   // starts at or after `lateFrom`
      weekend:          1,
      priorLateCancel:  3,   // cancelled inside 48h before
      priorNoShow:      4
    },
    highValueFrom: 300,
    lateFrom:      '18:00'
  },

  /* ---------- PATCH TESTING ----------
     Treatments that may not go ahead without a valid patch test, and
     how long a test stays valid for.                                */
  patchTest: {
    requiredFor: ['chemical-peel'],
    validForDays: 180,
    minHoursBefore: 24
  },

  /* ---------- CONTRAINDICATIONS ----------
     Terms watched for in the notes and the medical history answers.
     A hit is a flag for the practitioner to read, never an automatic
     refusal — the clinical decision stays with her.                 */
  flagTerms: [
    'warfarin', 'apixaban', 'rivaroxaban', 'clopidogrel', 'blood thinner', 'anticoagulant',
    'pregnant', 'pregnancy', 'breastfeeding', 'nursing',
    'autoimmune', 'lupus', 'myasthenia',
    'cold sore', 'herpes', 'active infection', 'shingles',
    'isotretinoin', 'roaccutane', 'accutane',
    'allergic', 'allergy', 'anaphyla',
    'vaccine', 'vaccination',
    'keloid', 'immunosuppress'
  ],

  /* ---------- STOCK ----------
     What one appointment consumes. Used to forecast against the
     diary so product is reordered before it runs short, and used
     before it expires.                                             */
  consumables: {
    'wrinkle-one':         { item: 'Toxin 100u vial',      units: 20 },
    'wrinkle-three':       { item: 'Toxin 100u vial',      units: 50 },
    'lip-filler':          { item: 'HA filler 1ml',        units: 1 },
    'cheek-filler':        { item: 'HA filler 1ml',        units: 2 },
    'polynucleotides':     { item: 'Polynucleotide 2ml',   units: 1 },
    'collagen-stimulator': { item: 'Collagen stimulator',  units: 1 },
    'chemical-peel':       { item: 'Peel solution 50ml',   units: 5 },
    'microneedling':       { item: 'Needle cartridge',     units: 1 }
  },
  stock: {
    reorderLeadDays: 14,       // warn this far before running out
    expiryWarnDays:  45        // warn this far before product expires
  },

  /* ---------- QUIET WEEKS ----------
     If the week ahead is emptier than this, the remaining slots are
     offered to clients who have not been in for a while.            */
  quiet: {
    bookedBelowPercent: 55,
    lapsedAfterWeeks:   16,
    maxOffers:          25
  },

  /* ---------- REVIEW PACING ----------
     Google treats a burst of reviews on one day as suspicious, so
     requests are spread out.                                        */
  reviewsPerDay: 3
};

const SHEETS = { bookings: 'Bookings', log: 'Log', waitlist: 'Waitlist', stock: 'Stock', leads: 'Leads' };
const HEADERS = ['Booking ID','Created','Date','Time','Treatment ID','Treatment','Duration','Price',
                 'First Name','Last Name','Email','Phone','Notes','Status','Calendar Event ID',
                 'Confirmation Sent','Prep Sent','Reminder 48h','Reminder 24h','Aftercare Sent',
                 'Review Asked','Rebook Nudged','Rebook Due',
                 'Risk Score','Deposit Asked','Patch Test OK','Flags','Consult Followed Up'];

const WAITLIST_HEADERS = ['Joined','Name','Email','Phone','Treatment ID','Treatment','Duration',
                          'Target Date','Flexibility','Status','Offered At','Offer Expires','Claim Token'];
const STOCK_HEADERS    = ['Item','On Hand','Unit','Expires','Reordered'];
const LEAD_HEADERS     = ['Seen','Name','Email','Phone','Treatment ID','Treatment','Date','Time','Status','Chased'];

/* ============================================================
   WEB APP ENDPOINTS
   ============================================================ */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'slots') {
      return json({ ok: true, slots: availableSlots(e.parameter.date, Number(e.parameter.duration || 30)) });
    }
    /* A whole month of free-slot counts in one request, so the calendar
       can mark full days without asking about each one separately. */
    if (action === 'month') {
      const dur = Number(e.parameter.duration || 45);
      const from = new Date(e.parameter.from + 'T00:00:00');
      const to   = new Date(e.parameter.to   + 'T00:00:00');
      const counts = {};
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = Utilities.formatDate(d, CONFIG.timezone, 'yyyy-MM-dd');
        counts[ds] = CONFIG.hours[d.getDay()] ? availableSlots(ds, dur).length : 0;
      }
      return json({ ok: true, counts: counts });
    }

    if (action === 'claim') {
      const r = claimSlot({ token: e.parameter.token });
      return HtmlService.createHtmlOutput(shell(
        r.ok ? 'The appointment is yours' : 'That slot has gone',
        '<p>' + (r.message || '') + '</p>'
      ));
    }
    return json({ ok: true, clinic: CONFIG.clinicName, status: 'live' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const b = JSON.parse(e.postData.contents);

    /* Routes that are not a booking. Each returns on its own. */
    if (b.action === 'waitlist') return json(joinWaitlist(b));
    if (b.action === 'claim')    return json(claimSlot(b));
    if (b.action === 'abandon')  return json(recordLead(b));
    if (b.action === 'cancel')   return json(cancelBooking(b));

    if (!b.firstName || !b.email || !b.date || !b.time || !b.treatmentId) {
      return json({ ok: false, error: 'Missing required fields' });
    }
    if (!CONFIG.treatments[b.treatmentId]) {
      return json({ ok: false, error: 'Unknown treatment' });
    }

    // Re-check availability inside the lock so two people can't take one slot.
    const free = availableSlots(b.date, Number(b.duration));
    if (free.indexOf(b.time) === -1) {
      return json({ ok: false, error: 'That time has just been taken. Please pick another.' });
    }

    /* A patch test is a hard gate. The booking does not happen without
       one, and the client is told what to book instead. */
    const patch = checkPatchTest(b);
    if (!patch.ok) {
      return json({ ok: false, error: patch.message, needsPatchTest: true });
    }

    const risk  = scoreNoShowRisk(b);
    const flags = flagContraindications(b.notes || '');

    const id  = 'BK' + Utilities.formatDate(new Date(), CONFIG.timezone, 'yyMMdd') + '-' +
                Math.random().toString(36).slice(2, 6).toUpperCase();
    const ev  = createCalendarEvent(b, id);
    const due = rebookDueDate(b.treatmentId, b.date, b.email);

    sheet(SHEETS.bookings).appendRow([
      id, new Date(), b.date, b.time, b.treatmentId, b.treatmentName, b.duration, b.price,
      b.firstName, b.lastName, b.email, b.phone, b.notes || '', 'Confirmed', ev,
      '', '', '', '', '', '', '', due,
      risk.score, risk.deposit ? 'Yes' : '', patch.ok ? 'Yes' : 'N/A', flags.join('; '), ''
    ]);

    sendConfirmation(b, id);
    markSent(id, 'Confirmation Sent');
    notifyOwner(b, id);
    if (risk.deposit) { requestDeposit(b, id, risk); }
    if (flags.length) { alertFlags(b, id, flags); }
    clearLead(b.email);
    log('BOOKING', id + ' ' + b.date + ' ' + b.time + ' ' + b.treatmentName +
                   ' risk=' + risk.score + (risk.deposit ? ' deposit' : '') +
                   (flags.length ? ' flags=' + flags.length : ''));

    return json({ ok: true, bookingId: id, depositRequested: risk.deposit });
  } catch (err) {
    log('ERROR', 'doPost: ' + err);
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   AVAILABILITY
   ============================================================ */

function availableSlots(dateStr, duration) {
  if (!dateStr) return [];
  const day = new Date(dateStr + 'T00:00:00');
  const h   = CONFIG.hours[day.getDay()];
  if (!h) return [];

  // Respect 24h minimum notice and 60-day horizon.
  const endOfDay = new Date(day); endOfDay.setHours(23, 59, 59);
  if (endOfDay < new Date(Date.now() + 24 * 3600e3)) return [];
  if (day > new Date(Date.now() + 60 * 864e5)) return [];

  const rows = sheet(SHEETS.bookings).getDataRange().getValues().slice(1);
  const same = rows.filter(function (r) {
    return fmtDate(r[2]) === dateStr && r[13] !== 'Cancelled';
  });
  if (same.length >= CONFIG.maxPerDay) return [];

  // Busy windows from the sheet, padded with the buffer.
  const busy = same.map(function (r) {
    const s = toMin(fmtTime(r[3]));
    return { s: s, e: s + Number(r[6]) + CONFIG.bufferMinutes };
  });

  // Busy windows from the calendar (catches anything booked by phone/walk-in).
  try {
    const cal = CONFIG.calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CONFIG.calendarId);
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0);
    const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59);
    cal.getEvents(dayStart, dayEnd).forEach(function (ev) {
      if (ev.isAllDayEvent()) return;
      busy.push({
        s: ev.getStartTime().getHours() * 60 + ev.getStartTime().getMinutes(),
        e: ev.getEndTime().getHours() * 60 + ev.getEndTime().getMinutes() + CONFIG.bufferMinutes
      });
    });
  } catch (err) {
    log('WARN', 'Calendar read failed: ' + err);
  }

  const out  = [];
  const open = toMin(h.open), close = toMin(h.close);
  for (let m = open; m + duration <= close; m += 15) {
    if (m % 30) continue;
    const clash = busy.some(function (b) { return m < b.e && (m + duration + CONFIG.bufferMinutes) > b.s; });
    if (!clash) out.push(toHHMM(m));
  }
  return out;
}

function createCalendarEvent(b, id) {
  try {
    const cal   = CONFIG.calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CONFIG.calendarId);
    const start = new Date(b.date + 'T' + b.time + ':00');
    const end   = new Date(start.getTime() + Number(b.duration) * 60000);
    const ev = cal.createEvent(
      b.treatmentName + ' — ' + b.firstName + ' ' + b.lastName,
      start, end,
      { description: [
          'Booking: ' + id,
          'Client: ' + b.firstName + ' ' + b.lastName,
          'Phone: ' + b.phone,
          'Email: ' + b.email,
          'Price: £' + b.price,
          b.notes ? 'Notes: ' + b.notes : ''
        ].filter(String).join('\n'),
        location: CONFIG.address }
    );
    return ev.getId();
  } catch (err) {
    log('WARN', 'Calendar write failed: ' + err);
    return '';
  }
}

/* ============================================================
   EMAILS
   ============================================================ */

function shell(title, bodyHtml) {
  return '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FAF7F3;padding:32px 28px;color:#211E1B">' +
    '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A97F54;margin-bottom:22px">' +
      CONFIG.clinicName + '</div>' +
    '<h1 style="font-weight:300;font-size:26px;line-height:1.2;margin:0 0 18px">' + title + '</h1>' +
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#57504A">' + bodyHtml + '</div>' +
    '<hr style="border:0;border-top:1px solid #E4DBD1;margin:28px 0 16px">' +
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8B837B">' +
      CONFIG.practitioner + ' · ' + CONFIG.address + '<br>' +
      CONFIG.phone + ' · <a href="https://wa.me/' + CONFIG.whatsapp + '" style="color:#A97F54">WhatsApp</a> · ' +
      '<a href="' + CONFIG.websiteUrl + '" style="color:#A97F54">' + CONFIG.websiteUrl.replace(/^https?:\/\//, '') + '</a>' +
    '</div></div>';
}

function bullets(arr) {
  return '<ul style="padding-left:18px;margin:12px 0">' +
    arr.map(function (x) { return '<li style="margin-bottom:7px">' + x + '</li>'; }).join('') + '</ul>';
}

function button(label, url) {
  return '<p style="margin:22px 0"><a href="' + url + '" style="display:inline-block;background:#211E1B;' +
    'color:#FAF7F3;text-decoration:none;padding:14px 26px;font-family:Helvetica,Arial,sans-serif;' +
    'font-size:12px;letter-spacing:2px;text-transform:uppercase">' + label + '</a></p>';
}

function send(to, subject, html) {
  MailApp.sendEmail({
    to: to, subject: subject, htmlBody: html,
    name: CONFIG.clinicName, replyTo: CONFIG.replyTo
  });
}

function prettyDate(dateStr) {
  return Utilities.formatDate(new Date(dateStr + 'T00:00:00'), CONFIG.timezone, 'EEEE d MMMM yyyy');
}

function sendConfirmation(b, id) {
  const html = shell('You\'re booked in, ' + b.firstName + '.',
    '<p><strong>' + b.treatmentName + '</strong><br>' +
      prettyDate(b.date) + ' at ' + b.time + '<br>' +
      CONFIG.address + '</p>' +
    '<p style="background:#F5EDE7;padding:14px 16px;border-left:2px solid #A97F54">' +
      '<strong>One thing before you come in.</strong><br>' +
      'Please complete your medical history and consent form. It takes about three minutes ' +
      'and we can\'t treat you without it.</p>' +
    button('Complete your form', CONFIG.medicalFormUrl) +
    '<p>We\'ll send prep instructions 48 hours before, and a short reminder the day before.</p>' +
    '<p>Need to change or cancel? Just reply to this email or message us on WhatsApp — ' +
      'we ask for 48 hours\' notice where you can.</p>' +
    '<p style="font-size:13px;color:#8B837B">Booking reference ' + id + '</p>');
  send(b.email, 'Your appointment — ' + prettyDate(b.date) + ' at ' + b.time, html);
}

function notifyOwner(b, id) {
  send(CONFIG.ownerEmail, 'New booking · ' + b.treatmentName + ' · ' + b.date + ' ' + b.time,
    shell('New booking',
      '<p><strong>' + b.firstName + ' ' + b.lastName + '</strong><br>' +
      b.treatmentName + ' — £' + b.price + '<br>' +
      prettyDate(b.date) + ' at ' + b.time + '</p>' +
      '<p>' + b.phone + '<br>' + b.email + '</p>' +
      (b.notes ? '<p style="background:#F5EDE7;padding:12px 14px"><em>' + b.notes + '</em></p>' : '') +
      button('Message on WhatsApp', 'https://wa.me/' + String(b.phone).replace(/[^0-9]/g, '').replace(/^0/, '44')) +
      '<p style="font-size:13px;color:#8B837B">' + id + '</p>'));
}

/* ============================================================
   SCHEDULED JOBS  (hourly trigger → runHourly)
   ============================================================ */

function runHourly() {
  try { sendPrep(); }      catch (e) { log('ERROR', 'sendPrep: ' + e); }
  try { sendReminders(); } catch (e) { log('ERROR', 'sendReminders: ' + e); }
  try { sendAftercare(); } catch (e) { log('ERROR', 'sendAftercare: ' + e); }
  try { askForReview(); }  catch (e) { log('ERROR', 'askForReview: ' + e); }
  try { nudgeRebook(); }      catch (e) { log('ERROR', 'nudgeRebook: ' + e); }
  try { workWaitlist(); }     catch (e) { log('ERROR', 'workWaitlist: ' + e); }
  try { chaseLeads(); }       catch (e) { log('ERROR', 'chaseLeads: ' + e); }
  try { followUpConsults(); } catch (e) { log('ERROR', 'followUpConsults: ' + e); }
}

/** Once a day is enough for these — they look at whole weeks, not hours. */
function runDaily() {
  try { forecastStock(); }  catch (e) { log('ERROR', 'forecastStock: ' + e); }
  try { fillQuietWeek(); }  catch (e) { log('ERROR', 'fillQuietWeek: ' + e); }
}

/** Walk the Bookings sheet, run `fn(row, index)`, write back any flags set. */
function eachBooking(fn) {
  const sh   = sheet(SHEETS.bookings);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][13] === 'Cancelled') continue;
    fn(data[i], i + 1, sh);
  }
}

function hoursUntil(dateStr, timeStr) {
  const at = new Date(fmtDate(dateStr) + 'T' + fmtTime(timeStr) + ':00');
  return (at.getTime() - Date.now()) / 3600e3;
}

function col(name) { return HEADERS.indexOf(name) + 1; }

function markSent(bookingId, colName) {
  const sh   = sheet(SHEETS.bookings);
  const ids  = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0] === bookingId) { sh.getRange(i + 1, col(colName)).setValue(new Date()); return; }
  }
}

function rowClient(r) {
  return { id: r[0], date: fmtDate(r[2]), time: fmtTime(r[3]), tid: r[4], treatment: r[5],
           first: r[8], last: r[9], email: r[10], phone: r[11] };
}

/* --- 48h prep email --- */
function sendPrep() {
  eachBooking(function (r, rowNum, sh) {
    if (r[16]) return;                                   // Prep Sent
    const h = hoursUntil(r[2], r[3]);
    if (h > 72 || h < 40) return;
    const c    = rowClient(r);
    const prep = CONFIG.prep[c.tid];
    if (!prep) { sh.getRange(rowNum, col('Prep Sent')).setValue(new Date()); return; }
    send(c.email, 'Getting ready for your appointment',
      shell('Two days to go, ' + c.first + '.',
        '<p>Your <strong>' + c.treatment + '</strong> is on ' + prettyDate(c.date) + ' at ' + c.time + '.</p>' +
        '<p>A few things that make a real difference to how the result settles:</p>' +
        bullets(prep) +
        '<p>If you haven\'t filled in your medical history form yet, please do it now — ' +
          'it saves us both time on the day.</p>' +
        button('Medical history form', CONFIG.medicalFormUrl)));
    sh.getRange(rowNum, col('Prep Sent')).setValue(new Date());
  });
}

/* --- 48h and 24h reminders --- */
function sendReminders() {
  eachBooking(function (r, rowNum, sh) {
    const c = rowClient(r);
    const h = hoursUntil(r[2], r[3]);

    if (!r[17] && h <= 50 && h >= 40) {                  // Reminder 48h
      send(c.email, 'Reminder — ' + prettyDate(c.date) + ' at ' + c.time,
        shell('See you in two days.',
          '<p><strong>' + c.treatment + '</strong><br>' + prettyDate(c.date) + ' at ' + c.time +
          '<br>' + CONFIG.address + '</p>' +
          '<p>If you need to move it, now is the easiest time — just reply to this email.</p>'));
      sh.getRange(rowNum, col('Reminder 48h')).setValue(new Date());
    }

    if (!r[18] && h <= 26 && h >= 16) {                  // Reminder 24h
      send(c.email, 'Tomorrow at ' + c.time,
        shell('Tomorrow, ' + c.first + '.',
          '<p><strong>' + c.treatment + '</strong><br>' + prettyDate(c.date) + ' at ' + c.time +
          '<br>' + CONFIG.address + '</p>' +
          '<p>Come with clean skin if you can, and allow a few extra minutes to settle in.</p>' +
          '<p>Running late or need to cancel? Message us on ' +
            '<a href="https://wa.me/' + CONFIG.whatsapp + '" style="color:#A97F54">WhatsApp</a>.</p>'));
      sh.getRange(rowNum, col('Reminder 24h')).setValue(new Date());
    }
  });
}

/* --- aftercare, evening of treatment --- */
function sendAftercare() {
  eachBooking(function (r, rowNum, sh) {
    if (r[19]) return;                                   // Aftercare Sent
    const h = hoursUntil(r[2], r[3]);
    if (h > -2 || h < -14) return;                       // 2–14 hours after
    const c    = rowClient(r);
    const care = CONFIG.aftercare[c.tid] || CONFIG.GENERIC_AFTERCARE;
    send(c.email, 'Looking after your ' + c.treatment.toLowerCase(),
      shell('Thanks for coming in today.',
        '<p>Here\'s your aftercare for <strong>' + c.treatment + '</strong>. ' +
          'Keep this email — it\'s easier than trying to remember.</p>' +
        bullets(care) +
        '<p>Anything at all that doesn\'t feel right, message us straight away. ' +
          'We would always rather hear from you.</p>' +
        button('Message on WhatsApp', 'https://wa.me/' + CONFIG.whatsapp)));
    sh.getRange(rowNum, col('Aftercare Sent')).setValue(new Date());
  });
}

/* --- review request, 24h after --- */
function askForReview() {
  /* Google treats a cluster of reviews landing on one day as suspicious,
     so requests are rationed. The window below is deliberately wide
     enough that a rationed request still goes out a day or two later
     rather than being dropped. */
  let sentToday = reviewsAskedToday();

  eachBooking(function (r, rowNum, sh) {
    if (r[20]) return;                                   // Review Asked
    if (sentToday >= CONFIG.reviewsPerDay) return;
    const h = hoursUntil(r[2], r[3]);
    if (h > -24 || h < -120) return;
    const c = rowClient(r);
    send(c.email, 'How are you getting on?',
      shell('How are you getting on, ' + c.first + '?',
        '<p>It\'s been a day since your ' + c.treatment.toLowerCase() + '. ' +
          'Two buttons — whichever is honest.</p>' +
        '<table role="presentation" style="margin:22px 0"><tr>' +
          '<td style="padding-right:10px"><a href="' + CONFIG.googleReviewUrl + '" ' +
            'style="display:inline-block;background:#211E1B;color:#FAF7F3;text-decoration:none;' +
            'padding:14px 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;' +
            'letter-spacing:2px;text-transform:uppercase">Really happy</a></td>' +
          '<td><a href="' + CONFIG.feedbackFormUrl + '" ' +
            'style="display:inline-block;background:transparent;color:#211E1B;text-decoration:none;' +
            'border:1px solid #E4DBD1;padding:13px 24px;font-family:Helvetica,Arial,sans-serif;' +
            'font-size:12px;letter-spacing:2px;text-transform:uppercase">Something\'s off</a></td>' +
        '</tr></table>' +
        '<p style="font-size:13px;color:#8B837B">If something isn\'t right, the second button goes ' +
          'straight to ' + CONFIG.practitioner + ' privately. We\'d rather fix it than not know.</p>'));
    sh.getRange(rowNum, col('Review Asked')).setValue(new Date());
    sentToday++;
  });
}

/** How many review requests have already gone out today. */
function reviewsAskedToday() {
  const data = sheet(SHEETS.bookings).getDataRange().getValues();
  const c = col('Review Asked') - 1;
  const today = new Date().toDateString();
  let n = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][c] && new Date(data[i][c]).toDateString() === today) n++;
  }
  return n;
}

/* --- rebooking nudge at the treatment cycle --- */
function nudgeRebook() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  eachBooking(function (r, rowNum, sh) {
    if (r[21]) return;                                   // Rebook Nudged
    if (!r[22]) return;                                  // Rebook Due
    const due = new Date(r[22]); due.setHours(0, 0, 0, 0);
    const daysAway = (due - today) / 864e5;
    if (daysAway > 10 || daysAway < -1) return;          // fire ~a week ahead
    const c = rowClient(r);
    send(c.email, 'Time for your next ' + c.treatment.toLowerCase() + '?',
      shell('You\'re about due, ' + c.first + '.',
        '<p>Your last <strong>' + c.treatment + '</strong> was on ' + prettyDate(c.date) + '. ' +
          'Most people book the next one around now to keep the result even — ' +
          'letting it wear off completely usually means starting again.</p>' +
        button('Book your next appointment', CONFIG.websiteUrl) +
        '<p style="font-size:13px;color:#8B837B">Not ready, or not coming back? No problem at all — ' +
          'just ignore this and we won\'t chase.</p>'));
    sh.getRange(rowNum, col('Rebook Nudged')).setValue(new Date());
  });
}

function rebookDueDate(treatmentId, dateStr, email) {
  const t = CONFIG.treatments[treatmentId];
  if (!t || !t.rebookWeeks) return '';

  /* The textbook cycle is the starting point, not the answer. Somebody
     who has come back at ten weeks twice does not want to be asked at
     twelve, and somebody who stretches to sixteen does not want to be
     asked at twelve either. Their own pattern wins once there is one. */
  let weeks = t.rebookWeeks;
  if (email) {
    const past = clientHistory(email).intervals.filter(function (w) {
      return w > 1 && w < t.rebookWeeks * 2;      // discard noise
    });
    if (past.length >= 2) {
      const mean = past.reduce(function (a, b) { return a + b; }, 0) / past.length;
      // Ask a little before they would have come anyway.
      weeks = Math.max(2, Math.round(mean) - 1);
    }
  }
  const d = new Date(fmtDate(dateStr) + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/* ============================================================
   MONTHLY OWNER REPORT  (monthly trigger → sendMonthlyReport)
   ============================================================ */

function sendMonthlyReport() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const rows = sheet(SHEETS.bookings).getDataRange().getValues().slice(1)
    .filter(function (r) { const d = new Date(fmtDate(r[2])); return d >= start && d <= end; });

  const done      = rows.filter(function (r) { return r[13] !== 'Cancelled' && r[13] !== 'No-show'; });
  const noShows   = rows.filter(function (r) { return r[13] === 'No-show'; });
  const revenue   = done.reduce(function (s, r) { return s + (Number(r[7]) || 0); }, 0);
  const reviews   = rows.filter(function (r) { return r[20]; }).length;
  const rebooked  = rows.filter(function (r) { return r[21]; }).length;
  const noShowPct = rows.length ? Math.round(noShows.length / rows.length * 100) : 0;

  const counts = {};
  done.forEach(function (r) { counts[r[5]] = (counts[r[5]] || 0) + 1; });
  const top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);

  const monthName = Utilities.formatDate(start, CONFIG.timezone, 'MMMM yyyy');

  const stat = function (label, value) {
    return '<tr><td style="padding:9px 0;border-bottom:1px solid #E4DBD1;color:#57504A">' + label +
           '</td><td style="padding:9px 0;border-bottom:1px solid #E4DBD1;text-align:right;' +
           'font-family:Georgia,serif;font-size:19px;color:#A97F54">' + value + '</td></tr>';
  };

  send(CONFIG.ownerEmail, monthName + ' — clinic report',
    shell(monthName,
      '<table role="presentation" style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:14px">' +
        stat('Appointments completed', done.length) +
        stat('Revenue booked', '£' + revenue.toLocaleString('en-GB')) +
        stat('Average per appointment', done.length ? '£' + Math.round(revenue / done.length) : '£0') +
        stat('No-shows', noShows.length + ' (' + noShowPct + '%)') +
        stat('Review requests sent', reviews) +
        stat('Rebooking nudges sent', rebooked) +
      '</table>' +
      (top.length ? '<p style="margin-top:26px"><strong>Most booked</strong></p>' +
        bullets(top.map(function (n) { return n + ' — ' + counts[n]; })) : '') +
      '<p style="font-size:13px;color:#8B837B;margin-top:24px">' +
        'Generated automatically from your booking sheet. Nothing to do — this is just so you can see the shape of the month.</p>'));

  log('REPORT', monthName + ' sent — ' + done.length + ' appts, £' + revenue);
}

/* ============================================================
   SETUP + UTILITIES
   ============================================================ */

/** Run this once by hand. Creates tabs, grants permissions, installs triggers. */
function firstRun() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let bk = ss.getSheetByName(SHEETS.bookings);
  if (!bk) bk = ss.insertSheet(SHEETS.bookings);
  if (bk.getLastRow() === 0) {
    bk.appendRow(HEADERS);
    bk.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F1EAE2');
    bk.setFrozenRows(1);
  }

  let lg = ss.getSheetByName(SHEETS.log);
  if (!lg) { lg = ss.insertSheet(SHEETS.log); lg.appendRow(['When', 'Type', 'Detail']); lg.setFrozenRows(1); }

  /* The engine's own tabs. Each is created once and left alone. */
  makeSheet(ss, SHEETS.waitlist, WAITLIST_HEADERS);
  makeSheet(ss, SHEETS.leads,    LEAD_HEADERS);
  const st = makeSheet(ss, SHEETS.stock, STOCK_HEADERS);
  if (st && st.getLastRow() === 1) {
    // Seed the shelf with the items the treatment menu actually consumes.
    const seen = {};
    Object.keys(CONFIG.consumables).forEach(function (k) {
      const c = CONFIG.consumables[k];
      if (seen[c.item]) return;
      seen[c.item] = true;
      st.appendRow([c.item, 0, 'units', '', '']);
    });
  }

  installTriggers();
  CalendarApp.getDefaultCalendar().getName();          // force calendar scope prompt
  log('SETUP', 'firstRun complete');
  SpreadsheetApp.getUi().alert('Clinic OS is set up.\n\nNext: Deploy > New deployment > Web app, then paste the /exec URL into config.js on the website.');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runHourly').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('runDaily').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('sendMonthlyReport').timeBased().onMonthDay(1).atHour(8).create();
}

/** Create a tab with a header row if it is not already there. */
function makeSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F1EAE2');
    sh.setFrozenRows(1);
  }
  return sh;
}

function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function log(type, detail) {
  try { sheet(SHEETS.log).appendRow([new Date(), type, detail]); } catch (ignore) {}
}

function toMin(hhmm)  { const p = String(hhmm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function toHHMM(mins) { return ('0' + Math.floor(mins / 60)).slice(-2) + ':' + ('0' + (mins % 60)).slice(-2); }

/** Sheets may hand back a Date or a string — normalise both. */
function fmtDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.timezone, 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}
function fmtTime(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.timezone, 'HH:mm');
  return String(v).slice(0, 5);
}

/* ============================================================
   DEMO DATA — run once to make the demo look lived-in
   ============================================================ */
function seedDemoBookings() {
  const first = ['Hannah','Priya','Marcus','Eleanor','Tom','Aisha','Sofia','James','Nina','Rachel',
                 'Daniel','Chloe','Yusuf','Beth','Olivia','Grace','Adam','Leila','Zoe','Ben'];
  const last  = ['Reed','Shah','Doyle','Vance','Bright','Karim','Russo','Hale','Petrov','Ellis',
                 'Okafor','Ward','Demir','Frost','Nolan','Chen','Boyle','Haddad','Marsh','Quinn'];
  const ids   = Object.keys(CONFIG.treatments);
  const sh    = sheet(SHEETS.bookings);

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 75) + 2;
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    if (!CONFIG.hours[d.getDay()]) { i--; continue; }

    const tid  = ids[Math.floor(Math.random() * ids.length)];
    const t    = CONFIG.treatments[tid];
    const hour = 10 + Math.floor(Math.random() * 7);
    const time = ('0' + hour).slice(-2) + ':' + (Math.random() > .5 ? '00' : '30');
    const ds   = Utilities.formatDate(d, CONFIG.timezone, 'yyyy-MM-dd');
    const fn   = first[i % first.length], ln = last[(i * 7) % last.length];
    const status = Math.random() > .93 ? 'No-show' : 'Completed';

    sh.appendRow([
      'BK-DEMO-' + (100 + i), d, ds, time, tid, t.name, 45, t.price,
      fn, ln, fn.toLowerCase() + '.' + ln.toLowerCase() + '@example.com',
      '07' + Math.floor(100000000 + Math.random() * 899999999),
      '', status, '', d, d, d, d, d, d, '', rebookDueDate(tid, ds)
    ]);
  }
  log('SETUP', 'Seeded 20 demo bookings');
}

/* ============================================================
   NO-SHOW RISK
   ------------------------------------------------------------
   A blanket deposit costs a clinic bookings from the clients it
   least wants to lose. This scores each booking instead, so only
   the ones that actually carry risk are asked.
   ============================================================ */

function scoreNoShowRisk(b) {
  const P = CONFIG.risk.points;
  const hist = clientHistory(b.email);
  let score = 0;
  const why = [];

  if (!hist.completed)                        { score += P.newClient;        why.push('new client'); }
  if (daysBetween(new Date(), b.date) > 21)   { score += P.bookedOver21Days; why.push('booked over three weeks ahead'); }
  if (Number(b.price) >= CONFIG.risk.highValueFrom) { score += P.highValue;  why.push('high value'); }
  if (toMin(b.time) >= toMin(CONFIG.risk.lateFrom)) { score += P.lateSlot;   why.push('late slot'); }

  const dow = new Date(b.date + 'T00:00:00').getDay();
  if (dow === 0 || dow === 6)                 { score += P.weekend;          why.push('weekend'); }
  if (hist.lateCancels)                       { score += P.priorLateCancel * hist.lateCancels; why.push('cancelled late before'); }
  if (hist.noShows)                           { score += P.priorNoShow * hist.noShows;         why.push('missed an appointment before'); }

  return { score: score, why: why, deposit: score >= CONFIG.risk.depositAt };
}

/** What this email address has done here before. */
function clientHistory(email) {
  const out = { completed: 0, lateCancels: 0, noShows: 0, lastDate: null, intervals: [] };
  if (!email) return out;
  const data = sheet(SHEETS.bookings).getDataRange().getValues();
  const dates = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][10]).toLowerCase() !== String(email).toLowerCase()) continue;
    const status = data[i][13];
    const d = fmtDate(data[i][2]);
    if (status === 'No Show')            out.noShows++;
    else if (status === 'Late Cancel')   out.lateCancels++;
    else if (new Date(d + 'T00:00:00') < new Date()) { out.completed++; dates.push(d); }
  }
  dates.sort();
  out.lastDate = dates.length ? dates[dates.length - 1] : null;
  for (let j = 1; j < dates.length; j++) {
    out.intervals.push(Math.round(daysBetween(dates[j - 1], dates[j]) / 7));
  }
  return out;
}

function requestDeposit(b, id, risk) {
  const amount = Math.round(Number(b.price) * CONFIG.risk.depositPercent / 100);
  send(b.email, 'A deposit to hold your appointment — ' + CONFIG.clinicName,
    shell('Holding your appointment',
      '<p>Hello ' + b.firstName + ',</p>' +
      '<p>Your ' + b.treatmentName + ' on ' + prettyDate(b.date) + ' at ' + b.time +
      ' is in the diary. Because it is a longer appointment booked some way ahead, we hold it with a ' +
      CONFIG.risk.depositPercent + '% deposit of <strong>£' + amount + '</strong>.</p>' +
      '<p>The deposit comes off the price on the day. It is refunded in full if you give us ' +
      '48 hours’ notice to move or cancel.</p>' +
      button('Pay the deposit', CONFIG.risk.depositUrl) +
      '<p style="font-size:13px;color:#666">Reference ' + id + '</p>'));
  markSent(id, 'Deposit Asked');
  log('DEPOSIT', id + ' score=' + risk.score + ' (' + risk.why.join(', ') + ')');
}

/* ============================================================
   PATCH TEST GATE
   ------------------------------------------------------------
   A hard stop, not a reminder. Some treatments may not go ahead
   without a valid test on file, and that is an insurance question
   rather than a scheduling one.
   ============================================================ */

function checkPatchTest(b) {
  if (CONFIG.patchTest.requiredFor.indexOf(b.treatmentId) === -1) return { ok: true, required: false };

  const data = sheet(SHEETS.bookings).getDataRange().getValues();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONFIG.patchTest.validForDays);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][10]).toLowerCase() !== String(b.email).toLowerCase()) continue;
    if (String(data[i][col('Patch Test OK') - 1]) !== 'Yes') continue;
    const when = new Date(fmtDate(data[i][2]) + 'T00:00:00');
    if (when >= cutoff && hoursUntil(b.date, b.time) >= CONFIG.patchTest.minHoursBefore) {
      return { ok: true, required: true };
    }
  }
  return {
    ok: false,
    required: true,
    message: 'A ' + b.treatmentName + ' needs a patch test at least ' +
             CONFIG.patchTest.minHoursBefore + ' hours beforehand, and we have not got a current one ' +
             'for you. Book a patch test first and we will hold this slot for you while you do.'
  };
}

/* ============================================================
   CONTRAINDICATION FLAGGING
   ------------------------------------------------------------
   Never an automatic refusal. It puts what the client wrote in
   front of the practitioner before she walks into the room.
   ============================================================ */

function flagContraindications(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return [];
  const hits = [];
  CONFIG.flagTerms.forEach(function (term) {
    if (t.indexOf(term) !== -1 && hits.indexOf(term) === -1) hits.push(term);
  });
  return hits;
}

function alertFlags(b, id, flags) {
  send(CONFIG.ownerEmail, 'Read before this appointment — ' + b.firstName + ' ' + (b.lastName || ''),
    shell('Something to read first',
      '<p><strong>' + b.firstName + ' ' + (b.lastName || '') + '</strong> — ' + b.treatmentName +
      ', ' + prettyDate(b.date) + ' at ' + b.time + '.</p>' +
      '<p>Their notes mention:</p>' + bullets(flags) +
      '<p>Their own words:</p><blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#444">' +
      String(b.notes || '').replace(/</g, '&lt;') + '</blockquote>' +
      '<p style="font-size:13px;color:#666">Flagged automatically for you to read. No decision has been made ' +
      'and the appointment stands. Reference ' + id + '.</p>'));
  log('FLAG', id + ' ' + flags.join(', '));
}

/* ============================================================
   WAITLIST
   ------------------------------------------------------------
   The automation that turns a cancellation back into a booking.
   Offers go out one at a time, in priority order, each with a
   window that expires — so the slot keeps moving down the list on
   its own until somebody takes it.
   ============================================================ */

function joinWaitlist(b) {
  if (!b.email || !b.treatmentId) return { ok: false, error: 'Missing details' };
  sheet(SHEETS.waitlist).appendRow([
    new Date(), b.firstName || '', b.email, b.phone || '',
    b.treatmentId, b.treatmentName || '', b.duration || 30,
    b.date || '', b.flexibility || 'day', 'Waiting', '', '', ''
  ]);
  send(b.email, 'You are on the waitlist — ' + CONFIG.clinicName,
    shell('On the list',
      '<p>Hello ' + (b.firstName || '') + ',</p>' +
      '<p>You are waiting on <strong>' + (b.treatmentName || 'a treatment') + '</strong>' +
      (b.flexibility === 'day' ? ' for ' + prettyDate(b.date) : '') + '.</p>' +
      '<p>If somebody cancels you will hear within seconds. You will have ' +
      CONFIG.waitlist.claimMinutes + ' minutes to take the slot before it passes to the next person, ' +
      'so it is worth keeping an eye on your phone.</p>' +
      '<p>Nothing is booked and nothing is owed.</p>'));
  log('WAITLIST', 'joined ' + b.email + ' ' + b.treatmentId + ' ' + (b.flexibility || 'day'));
  return { ok: true };
}

/** Cancel a booking and immediately put the hour back on the market. */
function cancelBooking(b) {
  const sh = sheet(SHEETS.bookings);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== b.bookingId) continue;
    const hrs = hoursUntil(data[i][2], data[i][3]);
    sh.getRange(i + 1, 14).setValue(hrs < 48 ? 'Late Cancel' : 'Cancelled');
    try { if (data[i][14]) CalendarApp.getCalendarById(CONFIG.calendarId).getEventById(data[i][14]).deleteEvent(); }
    catch (ignore) {}
    log('CANCEL', b.bookingId + ' ' + (hrs < 48 ? 'late' : 'in time'));
    releaseSlot({ date: fmtDate(data[i][2]), time: fmtTime(data[i][3]),
                  treatmentId: data[i][4], treatmentName: data[i][5], duration: data[i][6], price: data[i][7] });
    return { ok: true };
  }
  return { ok: false, error: 'Booking not found' };
}

/** Offer a freed slot to the best-matching person still waiting. */
function releaseSlot(slot) {
  const sh = sheet(SHEETS.waitlist);
  const data = sh.getDataRange().getValues();
  const candidates = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][9] !== 'Waiting') continue;
    if (data[i][4] !== slot.treatmentId) continue;
    const flex = data[i][8];
    const target = fmtDate(data[i][7]);
    let rank;
    if (flex === 'day' && target === slot.date)                 rank = 1;   // wants this exact day
    else if (flex === 'week' && sameWeek(target, slot.date))     rank = 2;
    else if (flex === 'any')                                     rank = 3;
    else continue;
    candidates.push({ row: i + 1, rank: rank, joined: new Date(data[i][0]), r: data[i] });
  }

  // Best match first; within a rank, whoever has waited longest.
  candidates.sort(function (a, b) { return a.rank - b.rank || a.joined - b.joined; });
  if (!candidates.length) {
    send(CONFIG.ownerEmail, 'A slot opened and the waitlist is empty',
      shell('Nobody waiting', '<p>' + slot.treatmentName + ' on ' + prettyDate(slot.date) +
        ' at ' + slot.time + ' is free and there is nobody on the waitlist for it.</p>'));
    return;
  }
  offerSlot(candidates[0], slot);
}

function offerSlot(cand, slot) {
  const sh    = sheet(SHEETS.waitlist);
  const token = Utilities.getUuid();
  const until = new Date(Date.now() + CONFIG.waitlist.claimMinutes * 60000);

  sh.getRange(cand.row, 10).setValue('Offered');
  sh.getRange(cand.row, 11).setValue(new Date());
  sh.getRange(cand.row, 12).setValue(until);
  sh.getRange(cand.row, 13).setValue(token + '|' + JSON.stringify(slot));

  const url = ScriptApp.getService().getUrl() + '?action=claim&token=' + token;
  send(cand.r[2], 'A ' + slot.treatmentName + ' has just come free',
    shell('It is yours if you want it',
      '<p>Hello ' + cand.r[1] + ',</p>' +
      '<p><strong>' + slot.treatmentName + '</strong> on <strong>' + prettyDate(slot.date) +
      ' at ' + slot.time + '</strong> has just come free.</p>' +
      '<p>You are first in line. The slot is held for you for ' + CONFIG.waitlist.claimMinutes +
      ' minutes, then it passes to the next person waiting.</p>' +
      button('Take this appointment', url) +
      '<p style="font-size:13px;color:#666">If it is no good, do nothing and we will keep you on the list.</p>'));
  log('WAITLIST', 'offered ' + slot.date + ' ' + slot.time + ' to ' + cand.r[2]);
}

/** Expire offers nobody took, and pass the slot down the list. */
function workWaitlist() {
  const sh   = sheet(SHEETS.waitlist);
  const data = sh.getDataRange().getValues();
  const now  = new Date();

  for (let i = 1; i < data.length; i++) {
    if (data[i][9] !== 'Offered') continue;
    const expires = data[i][11] ? new Date(data[i][11]) : null;
    if (!expires || expires > now) continue;

    sh.getRange(i + 1, 10).setValue('Passed');
    const payload = String(data[i][12] || '').split('|');
    if (payload.length < 2) continue;
    let slot; try { slot = JSON.parse(payload[1]); } catch (e) { continue; }

    // Still free? Then it goes to whoever is next.
    if (availableSlots(slot.date, Number(slot.duration)).indexOf(slot.time) !== -1) {
      log('WAITLIST', 'offer expired, moving on: ' + slot.date + ' ' + slot.time);
      releaseSlot(slot);
    }
  }
}

/** Somebody clicked the claim link. First one in wins. */
function claimSlot(b) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = sheet(SHEETS.waitlist);
    const data = sh.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const cell = String(data[i][12] || '');
      if (cell.indexOf(b.token + '|') !== 0) continue;
      if (data[i][9] !== 'Offered') return { ok: false, message: 'That offer has already been used.' };
      if (new Date(data[i][11]) < new Date()) return { ok: false, message: 'That offer ran out. You are still on the list.' };

      const slot = JSON.parse(cell.split('|')[1]);
      if (availableSlots(slot.date, Number(slot.duration)).indexOf(slot.time) === -1) {
        sh.getRange(i + 1, 10).setValue('Passed');
        return { ok: false, message: 'Somebody got there first. You are still on the list.' };
      }

      const booking = {
        firstName: data[i][1], lastName: '', email: data[i][2], phone: data[i][3],
        treatmentId: slot.treatmentId, treatmentName: slot.treatmentName,
        duration: slot.duration, price: slot.price,
        date: slot.date, time: slot.time, notes: 'Claimed from the waitlist'
      };
      const id = 'BK' + Utilities.formatDate(new Date(), CONFIG.timezone, 'yyMMdd') + '-' +
                 Math.random().toString(36).slice(2, 6).toUpperCase();
      const ev = createCalendarEvent(booking, id);

      sheet(SHEETS.bookings).appendRow([
        id, new Date(), booking.date, booking.time, booking.treatmentId, booking.treatmentName,
        booking.duration, booking.price, booking.firstName, booking.lastName, booking.email,
        booking.phone, booking.notes, 'Confirmed', ev,
        '', '', '', '', '', '', '', rebookDueDate(booking.treatmentId, booking.date, booking.email),
        0, '', 'N/A', '', ''
      ]);

      sh.getRange(i + 1, 10).setValue('Booked');
      sendConfirmation(booking, id);
      markSent(id, 'Confirmation Sent');
      notifyOwner(booking, id);
      log('WAITLIST', 'claimed ' + slot.date + ' ' + slot.time + ' by ' + booking.email);
      return { ok: true, message: 'Booked. Your confirmation and medical history form are on their way.' };
    }
    return { ok: false, message: 'We could not find that offer.' };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ============================================================
   ABANDONED BOOKINGS
   ------------------------------------------------------------
   Someone who picked a treatment and a time but did not confirm
   has told you almost everything. Following up with the slot they
   were looking at costs nothing.
   ============================================================ */

function recordLead(b) {
  if (!b.email) return { ok: false };
  sheet(SHEETS.leads).appendRow([
    new Date(), b.firstName || '', b.email, b.phone || '',
    b.treatmentId || '', b.treatmentName || '', b.date || '', b.time || '', 'Open', ''
  ]);
  return { ok: true };
}

function clearLead(email) {
  const sh = sheet(SHEETS.leads);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === String(email).toLowerCase() && data[i][8] === 'Open') {
      sh.getRange(i + 1, 9).setValue('Booked');
    }
  }
}

function chaseLeads() {
  const sh = sheet(SHEETS.leads);
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][8] !== 'Open') continue;
    const hrs = (Date.now() - new Date(data[i][0]).getTime()) / 3600e3;
    const chased = Number(data[i][9] || 0);

    if (chased === 0 && hrs >= 3) {
      const stillFree = data[i][6] &&
        availableSlots(fmtDate(data[i][6]), 30).indexOf(fmtTime(data[i][7])) !== -1;
      send(data[i][2], 'Your ' + data[i][5] + ' appointment is still available',
        shell('Still there if you want it',
          '<p>Hello ' + data[i][1] + ',</p>' +
          '<p>You were looking at <strong>' + data[i][5] + '</strong> on <strong>' +
          prettyDate(fmtDate(data[i][6])) + ' at ' + fmtTime(data[i][7]) + '</strong>' +
          (stillFree ? ', and it is still free.' : '. That one has gone, but there are others.') + '</p>' +
          button('Finish booking', CONFIG.websiteUrl) +
          '<p>If you had a question you did not want to put in a form, just reply to this. ' +
          'It reaches ' + CONFIG.practitioner + ' directly.</p>'));
      sh.getRange(i + 1, 10).setValue(1);

    } else if (chased === 1 && hrs >= 96) {
      send(data[i][2], 'The next two openings for ' + data[i][5],
        shell('Two dates that are free',
          '<p>Hello ' + data[i][1] + ',</p>' +
          '<p>No pressure at all — here are the next two openings for <strong>' +
          data[i][5] + '</strong> in case the timing is better.</p>' +
          bullets(nextOpenings(data[i][4], 2)) +
          button('Book one', CONFIG.websiteUrl) +
          '<p style="font-size:13px;color:#666">This is the last we will send about it.</p>'));
      sh.getRange(i + 1, 9).setValue('Closed');
      sh.getRange(i + 1, 10).setValue(2);
    }
  }
}

/** The next `n` bookable slots for a treatment, as readable lines. */
function nextOpenings(treatmentId, n) {
  const out = [];
  const dur = 45;
  for (let d = 1; d <= 45 && out.length < n; d++) {
    const day = new Date(); day.setDate(day.getDate() + d);
    const ds = Utilities.formatDate(day, CONFIG.timezone, 'yyyy-MM-dd');
    const free = availableSlots(ds, dur);
    if (free.length) out.push(prettyDate(ds) + ' at ' + free[0]);
  }
  return out.length ? out : ['Nothing free in the next six weeks — reply and we will sort something out'];
}

/* ============================================================
   CONSULTATION FOLLOW-UP
   ------------------------------------------------------------
   The consultation is already paid for in chair time. This is
   where that time either turns into a treatment or does not.
   ============================================================ */

function followUpConsults() {
  const sh = sheet(SHEETS.bookings);
  const data = sh.getDataRange().getValues();
  const c = col('Consult Followed Up');

  for (let i = 1; i < data.length; i++) {
    if (data[i][4] !== 'consultation') continue;
    if (data[i][13] === 'Cancelled') continue;
    const done = Number(data[i][c - 1] || 0);
    if (done >= 3) continue;

    const daysSince = -daysBetween(new Date(), fmtDate(data[i][2]));
    if (daysSince < 2) continue;

    // Did they book anything after the consultation?
    if (bookedSince(data[i][10], fmtDate(data[i][2]))) { sh.getRange(i + 1, c).setValue(3); continue; }

    const stage = daysSince >= 10 ? 3 : daysSince >= 5 ? 2 : 1;
    if (stage <= done) continue;

    const name = data[i][8];
    const body =
      stage === 1 ? '<p>Hello ' + name + ',</p><p>Good to meet you. Your written plan and the price we ' +
                    'talked about are attached to your record, and nothing has changed about either.</p>' +
                    '<p>If you want to go ahead, the booking page has the next openings.</p>'
      : stage === 2 ? '<p>Hello ' + name + ',</p><p>No pressure at all. If something is holding you up — ' +
                    'the price, the downtime, whether it is the right treatment — reply to this and ' +
                    CONFIG.practitioner + ' will answer it herself.</p>'
      :               '<p>Hello ' + name + ',</p><p>Last one from us about this. The plan stays on file, ' +
                    'so whenever you are ready you can pick it up where we left it.</p>';

    send(data[i][10], stage === 3 ? 'Leaving this with you' : 'After your consultation',
      shell('Your consultation', body + button('See the next openings', CONFIG.websiteUrl)));
    sh.getRange(i + 1, c).setValue(stage);
    log('CONSULT', 'follow-up ' + stage + ' to ' + data[i][10]);
  }
}

function bookedSince(email, afterDate) {
  const data = sheet(SHEETS.bookings).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][10]).toLowerCase() !== String(email).toLowerCase()) continue;
    if (data[i][4] === 'consultation') continue;
    if (new Date(data[i][1]) > new Date(afterDate + 'T00:00:00')) return true;
  }
  return false;
}

/* ============================================================
   QUIET WEEKS
   ------------------------------------------------------------
   Demand pushed towards the empty days, rather than a discount
   sent to everybody.
   ============================================================ */

function fillQuietWeek() {
  let slots = 0, booked = 0;
  const days = [];
  for (let d = 1; d <= 7; d++) {
    const day = new Date(); day.setDate(day.getDate() + d);
    const ds = Utilities.formatDate(day, CONFIG.timezone, 'yyyy-MM-dd');
    const h = CONFIG.hours[day.getDay()];
    if (!h) continue;
    const capacity = Math.floor((toMin(h.close) - toMin(h.open)) / 60);
    const free = availableSlots(ds, 45).length;
    slots += capacity; booked += Math.max(0, capacity - free);
    if (free) days.push(prettyDate(ds) + ' — ' + free + ' free');
  }
  if (!slots) return;

  const pct = Math.round(booked / slots * 100);
  if (pct >= CONFIG.quiet.bookedBelowPercent) { log('QUIET', 'week is ' + pct + '% booked, no action'); return; }

  const lapsed = lapsedClients(CONFIG.quiet.lapsedAfterWeeks).slice(0, CONFIG.quiet.maxOffers);
  lapsed.forEach(function (c) {
    send(c.email, 'A few appointments free this week',
      shell('This week is quiet',
        '<p>Hello ' + c.name + ',</p>' +
        '<p>It has been a little while. There are some appointments free this week if the timing suits:</p>' +
        bullets(days) +
        button('Book one', CONFIG.websiteUrl) +
        '<p style="font-size:13px;color:#666">No offer attached and no discount — just the openings.</p>'));
  });
  log('QUIET', 'week ' + pct + '% booked, offered to ' + lapsed.length + ' lapsed clients');
}

function lapsedClients(weeks) {
  const data = sheet(SHEETS.bookings).getDataRange().getValues();
  const seen = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][13] === 'Cancelled') continue;
    const email = String(data[i][10]).toLowerCase();
    const d = fmtDate(data[i][2]);
    if (!seen[email] || d > seen[email].last) seen[email] = { name: data[i][8], email: data[i][10], last: d };
  }
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weeks * 7);
  return Object.keys(seen)
    .map(function (k) { return seen[k]; })
    .filter(function (c) { return new Date(c.last + 'T00:00:00') < cutoff; });
}

/* ============================================================
   STOCK AND EXPIRY
   ------------------------------------------------------------
   Toxin and filler have shelf lives. Product thrown away unopened
   is money already spent.
   ============================================================ */

function forecastStock() {
  const need = {};
  const horizon = CONFIG.stock.reorderLeadDays;

  eachBooking(function (r) {
    const d = fmtDate(r[2]);
    const days = daysBetween(new Date(), d);
    if (days < 0 || days > horizon) return;
    const c = CONFIG.consumables[r[4]];
    if (!c) return;
    need[c.item] = (need[c.item] || 0) + c.units;
  });

  const sh = sheet(SHEETS.stock);
  const data = sh.getDataRange().getValues();
  const short = [], expiring = [];

  for (let i = 1; i < data.length; i++) {
    const item = data[i][0];
    const onHand = Number(data[i][1] || 0);
    const required = need[item] || 0;
    if (required > onHand) {
      short.push(item + ' — ' + onHand + ' left, ' + required + ' needed in the next ' + horizon + ' days');
    }
    if (data[i][3]) {
      const days = daysBetween(new Date(), fmtDate(data[i][3]));
      if (days >= 0 && days <= CONFIG.stock.expiryWarnDays) {
        expiring.push(item + ' — expires in ' + days + ' days, ' + onHand + ' on hand' +
                      (required < onHand ? ' and only ' + required + ' booked for' : ''));
      }
    }
  }

  if (!short.length && !expiring.length) { log('STOCK', 'nothing to flag'); return; }
  send(CONFIG.ownerEmail, 'Stock — ' + (short.length ? short.length + ' to reorder' : '') +
       (short.length && expiring.length ? ', ' : '') + (expiring.length ? expiring.length + ' expiring' : ''),
    shell('Stock',
      (short.length ? '<h3 style="font-size:15px">Running short</h3>' + bullets(short) : '') +
      (expiring.length ? '<h3 style="font-size:15px">Expiring soon</h3>' + bullets(expiring) : '') +
      '<p style="font-size:13px;color:#666">Forecast from the appointments already in the diary for the ' +
      'next ' + horizon + ' days.</p>'));
  log('STOCK', short.length + ' short, ' + expiring.length + ' expiring');
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function daysBetween(from, to) {
  const a = (from instanceof Date) ? from : new Date(fmtDate(from) + 'T00:00:00');
  const b = (to   instanceof Date) ? to   : new Date(fmtDate(to)   + 'T00:00:00');
  return Math.round((b.setHours(0,0,0,0) - a.setHours(0,0,0,0)) / 864e5);
}

function sameWeek(a, b) {
  if (!a || !b) return false;
  const da = new Date(fmtDate(a) + 'T00:00:00');
  const db = new Date(fmtDate(b) + 'T00:00:00');
  const monday = function (d) { const x = new Date(d); const k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return x.toDateString(); };
  return monday(da) === monday(db);
}
