#!/usr/bin/env node
/* ============================================================
   CLINIC OS — PROGRAMMATIC SEO GENERATOR
   ------------------------------------------------------------
   Builds one static landing page per (treatment × area) from data
   the site already holds, plus sitemap.xml and robots.txt.

     node seo-generate.js          # write pages
     node seo-generate.js --dry    # list what it would write

   WHY THIS EXISTS
   A clinic's whole top-of-funnel is usually Instagram and word of
   mouth. Nobody searching "lip filler Bethnal Green" ever finds
   them. These pages are the cheapest durable fix: they cost £0 to
   host, they compound month over month, and they are generated
   from treatments.js — so they stay correct when prices change.

   THIN-CONTENT WARNING — READ BEFORE RAISING THE PAGE COUNT
   Fifty pages that differ only by a place name is spam, and Google
   treats it as such. Every page here carries the treatment's own
   real substance (what it is, how long, what it costs, how to
   prepare, how to look after it, when to come back) plus genuine
   local detail written per area. If you add areas, write real
   `blurb` and `travel` copy for each one. Do not template it.
   Better twelve pages that deserve to rank than fifty that don't.
   ============================================================ */

const fs   = require('fs');
const path = require('path');

/* ---------- load site data (plain scripts, no modules) ---------- */
function load(file) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const sandbox = {};
  new Function('exports', src + '\n;Object.assign(exports, {' +
    'CLINIC: typeof CLINIC !== "undefined" ? CLINIC : undefined,' +
    'TREATMENTS: typeof TREATMENTS !== "undefined" ? TREATMENTS : undefined,' +
    'TREATMENT_CATEGORIES: typeof TREATMENT_CATEGORIES !== "undefined" ? TREATMENT_CATEGORIES : undefined' +
    '});')(sandbox);
  return sandbox;
}

const { CLINIC }     = load('config.js');
const { TREATMENTS } = load('treatments.js');

const SEO = CLINIC.seo;
if (!SEO || !SEO.enabled) {
  console.error('config.js: seo.enabled is false — nothing to generate.');
  process.exit(1);
}

const DRY  = process.argv.includes('--dry');
const OUT  = path.join(__dirname, SEO.outDir || 'find');
const BASE = SEO.siteUrl.replace(/\/$/, '');

/* ---------- helpers ---------- */
const slug = s => s.toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = t => t.price === 0 ? 'from £0 — consultations are free' : `£${t.price}`;

const dur = m => m < 60 ? `${m} minutes`
  : (m % 60 ? `${Math.floor(m/60)} hr ${m%60} min` : `${Math.floor(m/60)} hour${m>60?'s':''}`);

/* ---------- page template ---------- */
function page(t, area) {
  const title = `${t.name} in ${area.name} | ${CLINIC.name}`;
  const url   = `${BASE}/${SEO.outDir}/${slug(t.name)}-${slug(area.name)}/`;
  const desc  = `${t.name} in ${area.name} from ${money(t)}. ${t.summary} ` +
                `Doctor-led, ${dur(t.duration)}, prices published. Book online.`.slice(0, 300);

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": CLINIC.name,
    "url": url,
    "telephone": CLINIC.contact.phone,
    "email": CLINIC.contact.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": CLINIC.contact.address,
      "addressLocality": CLINIC.contact.city,
      "postalCode": CLINIC.contact.postcode,
      "addressCountry": "GB"
    },
    "areaServed": { "@type": "Place", "name": area.name },
    "medicalSpecialty": "PlasticSurgery",
    "makesOffer": {
      "@type": "Offer",
      "itemOffered": { "@type": "Service", "name": t.name, "description": t.summary },
      ...(t.price > 0 && { "price": String(t.price), "priceCurrency": "GBP" })
    }
  };

  const list = arr => arr.length
    ? `<ul class="care-list">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0B0A0A">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../styles.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>

<header class="nav is-stuck" id="nav">
  <a class="nav__brand" href="../../">
    <span class="bn">${esc(CLINIC.shortName)}</span>
    <span class="bl">${esc(CLINIC.location)}</span>
  </a>
  <nav class="nav__links">
    <a href="../../#treatments">Treatments</a>
    <a href="../../#aftercare">Aftercare</a>
    <a href="../../#visit">Visit</a>
    <a class="btn btn--gold nav__cta" href="../../#treatments">Book</a>
  </nav>
</header>

<section class="section" style="padding-top:9rem">
  <div class="wrap">
    <p class="eyebrow">${esc(area.name)} · ${esc(CLINIC.location.split(',').pop().trim())}</p>
    <h1 style="font-size:clamp(2.4rem,6vw,4rem)">${esc(t.name)} in ${esc(area.name)}</h1>
    <p class="lede" style="margin-top:1.4rem">${esc(t.summary)}</p>

    <div class="stats" style="margin-top:2.5rem">
      <div class="stat">
        <div class="stat__v">${t.price === 0 ? 'Free' : '£' + t.price}</div>
        <div class="stat__l">${t.price === 0 ? 'Consultation' : 'Published price'}</div>
      </div>
      <div class="stat">
        <div class="stat__v">${t.duration}<span style="font-size:1.1rem"> min</span></div>
        <div class="stat__l">Appointment length</div>
      </div>
      ${t.rebookWeeks ? `<div class="stat">
        <div class="stat__v">${t.rebookWeeks}<span style="font-size:1.1rem"> wk</span></div>
        <div class="stat__l">Typical repeat cycle</div>
      </div>` : ''}
    </div>

    <p style="margin-top:2.5rem"><a class="btn btn--gold" href="../../#treatments">Book ${esc(t.name.toLowerCase())}</a></p>
  </div>
</section>

<section class="section band">
  <div class="wrap" style="max-width:760px">
    <h2>What it involves</h2>
    <p class="lede" style="margin-top:1.2rem">${esc(t.detail)}</p>

    ${t.prep.length ? `<div style="margin-top:2.5rem">
      <p class="care-title">Before your appointment</p>
      ${list(t.prep)}
    </div>` : ''}

    ${t.aftercare.length ? `<div style="margin-top:2.2rem">
      <p class="care-title">Afterwards</p>
      ${list(t.aftercare)}
      <p class="muted" style="font-size:.9rem;margin-top:1rem">
        You don't have to remember any of this — it's emailed to you before and after.</p>
    </div>` : ''}
  </div>
</section>

<section class="section">
  <div class="wrap" style="max-width:760px">
    <h2>Getting here from ${esc(area.name)}</h2>
    <p class="lede" style="margin-top:1.2rem">${esc(area.blurb)}</p>
    <p class="lede" style="margin-top:1rem">${esc(area.travel)}</p>

    <dl class="info-rows" style="margin-top:2.25rem">
      <div class="info-row"><dt>Clinic</dt><dd>${esc(CLINIC.contact.address)}, ${esc(CLINIC.contact.city)} ${esc(CLINIC.contact.postcode)}</dd></div>
      <div class="info-row"><dt>Phone</dt><dd><a href="tel:${esc(CLINIC.contact.phone.replace(/\s/g,''))}">${esc(CLINIC.contact.phone)}</a></dd></div>
      <div class="info-row"><dt>Practitioner</dt><dd>${esc(CLINIC.practitioner.name)} — ${esc(CLINIC.practitioner.credentials)}</dd></div>
    </dl>

    <p style="margin-top:2.25rem">
      <a class="btn btn--gold" href="../../#treatments">See all treatments &amp; prices</a>
    </p>
  </div>
</section>

<footer class="foot">
  <div class="wrap">
    <div class="foot__bottom">
      <span>&copy; ${new Date().getFullYear()} ${esc(CLINIC.name)}</span>
      <span class="foot__by">Site &amp; booking system by
        <a href="https://saldigital.co" style="color:var(--gold2);text-decoration:none">SAL Digital</a></span>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

/* ---------- build ---------- */
const targets = TREATMENTS.filter(t => (SEO.treatments || []).includes(t.id));
const areas   = SEO.areas || [];

if (!targets.length || !areas.length) {
  console.error('Nothing to build — check seo.treatments and seo.areas in config.js.');
  process.exit(1);
}

const written = [];
for (const t of targets) {
  for (const a of areas) {
    const dir = path.join(OUT, `${slug(t.name)}-${slug(a.name)}`);
    const rel = `${SEO.outDir}/${slug(t.name)}-${slug(a.name)}/index.html`;
    written.push(rel);
    if (DRY) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page(t, a));
  }
}

/* ---------- sitemap + robots ---------- */
const urls = [`${BASE}/`, ...written.map(r => `${BASE}/${r.replace(/index\.html$/, '')}`)];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;

if (!DRY) {
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(__dirname, 'robots.txt'), robots);
}

console.log(`${DRY ? '[dry run] would write' : 'wrote'} ${written.length} pages ` +
            `(${targets.length} treatments × ${areas.length} areas)`);
written.forEach(w => console.log('  ' + w));
if (!DRY) console.log('  sitemap.xml\n  robots.txt');
console.log('\nNext: commit these, then submit ' + BASE + '/sitemap.xml in Google Search Console.');
