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
  GENERIC_AFTERCARE: ['Avoid heat, exercise and alcohol for 24 hours', 'Keep the area clean', 'SPF daily', 'Message us if anything worries you']
};

const SHEETS = { bookings: 'Bookings', log: 'Log' };
const HEADERS = ['Booking ID','Created','Date','Time','Treatment ID','Treatment','Duration','Price',
                 'First Name','Last Name','Email','Phone','Notes','Status','Calendar Event ID',
                 'Confirmation Sent','Prep Sent','Reminder 48h','Reminder 24h','Aftercare Sent',
                 'Review Asked','Rebook Nudged','Rebook Due'];

/* ============================================================
   WEB APP ENDPOINTS
   ============================================================ */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'slots') {
      return json({ ok: true, slots: availableSlots(e.parameter.date, Number(e.parameter.duration || 30)) });
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

    const id  = 'BK' + Utilities.formatDate(new Date(), CONFIG.timezone, 'yyMMdd') + '-' +
                Math.random().toString(36).slice(2, 6).toUpperCase();
    const ev  = createCalendarEvent(b, id);
    const due = rebookDueDate(b.treatmentId, b.date);

    sheet(SHEETS.bookings).appendRow([
      id, new Date(), b.date, b.time, b.treatmentId, b.treatmentName, b.duration, b.price,
      b.firstName, b.lastName, b.email, b.phone, b.notes || '', 'Confirmed', ev,
      '', '', '', '', '', '', '', due
    ]);

    sendConfirmation(b, id);
    markSent(id, 'Confirmation Sent');
    notifyOwner(b, id);
    log('BOOKING', id + ' ' + b.date + ' ' + b.time + ' ' + b.treatmentName);

    return json({ ok: true, bookingId: id });
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
  try { nudgeRebook(); }   catch (e) { log('ERROR', 'nudgeRebook: ' + e); }
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
  eachBooking(function (r, rowNum, sh) {
    if (r[20]) return;                                   // Review Asked
    const h = hoursUntil(r[2], r[3]);
    if (h > -24 || h < -48) return;
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
  });
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

function rebookDueDate(treatmentId, dateStr) {
  const t = CONFIG.treatments[treatmentId];
  if (!t || !t.rebookWeeks) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + t.rebookWeeks * 7);
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

  installTriggers();
  CalendarApp.getDefaultCalendar().getName();          // force calendar scope prompt
  log('SETUP', 'firstRun complete');
  SpreadsheetApp.getUi().alert('Clinic OS is set up.\n\nNext: Deploy > New deployment > Web app, then paste the /exec URL into config.js on the website.');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runHourly').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('sendMonthlyReport').timeBased().onMonthDay(1).atHour(8).create();
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
