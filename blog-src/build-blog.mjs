// Generates: one page per post (<slug>.html), blog.html, sitemap.xml, robots.txt,
// and swaps the "Blog" nav dropdown into every page that uses the shared nav.
// Usage: node blog-src/build-blog.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { POSTS, CATEGORIES } from './posts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jdroofingsolutions.com';
const PER_PAGE = 12;
const catName = id => CATEGORIES.find(c => c.id === id).name;
const enc = p => p.split('/').map(encodeURIComponent).join('/');
const esc = s => s.replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

// Newest first; stable within the same date (catalog order).
const posts = POSTS.map((p, i) => ({ ...p, i })).sort((a, b) => b.date.localeCompare(a.date) || a.i - b.i);
for (const p of posts) {
  p.body = read(`blog-src/content/${p.slug}.html`).trim();
  const words = p.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  p.minutes = Math.max(2, Math.round(words / 220));
  p.words = words;
  if (!fs.existsSync(path.join(ROOT, p.img))) throw new Error(`Missing image for ${p.slug}: ${p.img}`);
}

// ---------- Shared nav ----------
const desktopBlogNav = `<div class="nav-dropdown-wrap">
        <a href="blog.html" class="nav-link" style="display:flex;align-items:center;gap:5px;">Blog<svg class="arr" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></a>
        <div class="nav-dropdown">
          <a href="blog.html">All Articles</a>
${CATEGORIES.map(c => `          <a href="blog.html?cat=${c.id}">${esc(c.name)}</a>`).join('\n')}
        </div>
      </div>`;
const mobileBlogNav = `<div class="mob-services">
    <button class="mob-services-btn" onclick="this.classList.toggle('active');this.nextElementSibling.classList.toggle('open')">Blog<svg class="arr" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button>
    <div class="mob-services-sub">
      <a href="blog.html">All Articles</a>
${CATEGORIES.map(c => `      <a href="blog.html?cat=${c.id}">${esc(c.name)}</a>`).join('\n')}
    </div>
  </div>`;

// Replace whichever advice/blog dropdown a page currently has with the Blog dropdown.
function swapNav(html) {
  for (const label of ['Roofing Advice<svg', 'Blog<svg']) {
    let idx = html.indexOf(`style="display:flex;align-items:center;gap:5px;">${label}`);
    if (idx !== -1) {
      const s = html.lastIndexOf('<div class="nav-dropdown-wrap">', idx);
      const e = html.indexOf('</div>', html.indexOf('</div>', idx) + 6) + 6;
      html = html.slice(0, s) + desktopBlogNav + html.slice(e);
    }
    idx = html.indexOf(`classList.toggle('open')">${label}`);
    if (idx !== -1) {
      const s = html.lastIndexOf('<div class="mob-services">', idx);
      const e = html.indexOf('</div>', html.indexOf('</div>', idx) + 6) + 6;
      html = html.slice(0, s) + mobileBlogNav + html.slice(e);
    }
  }
  return html;
}

// ---------- Page shell (from the shared article template) ----------
const tpl = swapNav(read('blog-src/shell.html'));
const BLOG_CSS = read('blog-src/blog.css');

function page({ title, description, canonical, image, jsonld, main, ogType = 'website' }) {
  const head = `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="JD Roofing Solutions" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/${enc(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;
  return tpl.replace('{{HEAD}}', head).replace('/*{{BLOG_CSS}}*/', BLOG_CSS).replace('{{MAIN}}', main);
}

const card = (p, extra = '') => `<article class="blog-card" data-cat="${p.cat}"${extra}>
      <a href="${p.slug}.html" class="blog-card-img" tabindex="-1" aria-hidden="true"><img src="${enc(p.img)}" alt="" loading="lazy" decoding="async"></a>
      <div class="blog-card-body">
        <div class="blog-card-meta"><a href="blog.html?cat=${p.cat}" class="blog-tag">${esc(catName(p.cat))}</a><span>${fmtDate(p.date)}</span></div>
        <h3><a href="${p.slug}.html">${esc(p.title)}</a></h3>
        <p>${esc(p.excerpt)}</p>
        <a href="${p.slug}.html" class="blog-more">Read More <span aria-hidden="true">&rarr;</span></a>
      </div>
    </article>`;

const ctaBlock = (eyebrow, heading, text) => `<!-- CTA -->
<section style="background:#071118; padding:72px 28px; position:relative; overflow:hidden;">
  <div style="position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%, rgba(59,158,240,0.18) 0%, transparent 65%);"></div>
  <div style="position:relative; z-index:1; max-width:700px; margin:0 auto; text-align:center;">
    <span style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#3B9EF0; display:block; margin-bottom:14px;">${eyebrow}</span>
    <h2 class="cta-heading" style="font-size:40px; font-weight:900; color:white; margin-bottom:14px; letter-spacing:-0.02em;">${heading}</h2>
    <p style="color:#93AABF; font-size:15px; line-height:1.75; margin-bottom:32px;">${text}</p>
    <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
      <a href="index.html#contact" class="btn-blue" style="font-size:14px; padding:16px 36px;">Get My Free Estimate &rarr;</a>
      <a href="tel:8322953277" class="btn-ghost">&#9990; 832-295-3277</a>
    </div>
  </div>
</section>`;

const ORG = { '@type': 'RoofingContractor', name: 'JD Roofing Solutions', url: SITE, telephone: '+1-832-295-3277',
  address: { '@type': 'PostalAddress', streetAddress: '10108 Veterans Memorial Dr', addressLocality: 'Houston', addressRegion: 'TX', postalCode: '77014', addressCountry: 'US' } };

// ---------- Post pages ----------
for (const p of posts) {
  const url = `${SITE}/${p.slug}.html`;
  const sameCat = posts.filter(q => q.slug !== p.slug && q.cat === p.cat);
  const others = posts.filter(q => q.slug !== p.slug && q.cat !== p.cat);
  const related = [...sameCat, ...others].slice(0, 3);
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BlogPosting', headline: p.title, description: p.excerpt, image: `${SITE}/${enc(p.img)}`,
      datePublished: p.date, dateModified: p.date, mainEntityOfPage: url, articleSection: catName(p.cat), wordCount: p.words,
      author: { '@type': 'Organization', name: 'JD Roofing Solutions', url: SITE }, publisher: ORG },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog.html` },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] } ] };
  const main = `<!-- HERO -->
<section style="position:relative; min-height:380px; display:flex; align-items:center; overflow:hidden; padding-top:70px;">
  <div style="position:absolute; inset:0; background-image:url('${enc(p.img)}'); background-size:cover; background-position:center;"></div>
  <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(7,17,24,0.94) 0%, rgba(7,17,24,0.78) 60%, rgba(7,17,24,0.4) 100%);"></div>
  <div style="position:relative; z-index:1; width:100%; max-width:900px; margin:0 auto; padding:56px 28px;">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="blog.html">Blog</a><span>/</span><a href="blog.html?cat=${p.cat}">${esc(catName(p.cat))}</a></nav>
    <h1 class="m-hero-h1" style="font-size:40px; font-weight:800; color:white; line-height:1.15; letter-spacing:-0.02em; margin-bottom:16px;">${esc(p.title)}</h1>
    <p style="color:rgba(255,255,255,0.72); font-size:14.5px; line-height:1.75;">JD Roofing Solutions &middot; <time datetime="${p.date}">${fmtDate(p.date)}</time> &middot; ${p.minutes} min read</p>
  </div>
</section>

<!-- ARTICLE -->
<section style="padding:64px 28px 76px; background:white;">
  <div class="article" style="max-width:760px; margin:0 auto;">
${p.body}
    <div class="article-back"><a href="blog.html" class="inline-link">&larr; Back to all articles</a></div>
  </div>
</section>

<!-- RELATED -->
<section class="blog-related">
  <div style="max-width:1200px; margin:0 auto;">
    <span class="eyebrow">Keep Reading</span>
    <h2 class="blog-h2">Related Articles</h2>
    <div class="blog-grid">
    ${related.map(r => card(r)).join('\n    ')}
    </div>
  </div>
</section>

${ctaBlock('Free Inspection', 'Have More Roofing Questions?', "Get your free estimate today. We'll answer any question about your roof, no pressure, no obligation.")}`;
  write(`${p.slug}.html`, page({ title: `${p.title} | JD Roofing Solutions`, description: p.excerpt, canonical: url, image: p.img, jsonld, main, ogType: 'article' }));
}

// ---------- Blog index ----------
const blogUrl = `${SITE}/blog.html`;
const blogJsonld = { '@context': 'https://schema.org', '@type': 'Blog', name: 'JD Roofing Solutions Blog', url: blogUrl,
  description: 'Roofing advice for Houston homeowners and businesses.', publisher: ORG,
  blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/${p.slug}.html`, datePublished: p.date })) };
const blogMain = `<!-- HERO -->
<section style="position:relative; min-height:440px; display:flex; align-items:center; overflow:hidden; padding-top:70px;">
  <div style="position:absolute; inset:0; background-image:url('${enc('Brand_assets/worker.webp')}'); background-size:cover; background-position:center;"></div>
  <div style="position:absolute; inset:0; background:linear-gradient(90deg, rgba(7,17,24,0.94) 0%, rgba(7,17,24,0.8) 55%, rgba(7,17,24,0.45) 100%);"></div>
  <div style="position:relative; z-index:1; width:100%; max-width:1200px; margin:0 auto; padding:56px 28px;">
    <span style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#3B9EF0; display:block; margin-bottom:14px;">JD Roofing Blog</span>
    <h1 class="m-hero-h1" style="font-size:48px; font-weight:800; color:white; line-height:1.1; letter-spacing:-0.02em; margin-bottom:16px; max-width:720px;">Houston Roofing Guides</h1>
    <p style="color:rgba(255,255,255,0.78); font-size:16px; line-height:1.75; max-width:620px;">Roofing advice for Texas homeowners. Straight answers on roof replacement costs, leak repairs, storm and hail damage, insurance claims, and choosing the right materials for Houston weather.</p>
  </div>
</section>

<!-- POSTS -->
<section class="blog-list">
  <div style="max-width:1200px; margin:0 auto;">
    <div class="blog-filters" role="toolbar" aria-label="Filter articles by topic">
      <button type="button" class="blog-pill" data-filter="all" aria-pressed="true">All Articles <span>${posts.length}</span></button>
${CATEGORIES.map(c => `      <button type="button" class="blog-pill" data-filter="${c.id}" aria-pressed="false">${esc(c.name)} <span>${posts.filter(p => p.cat === c.id).length}</span></button>`).join('\n')}
    </div>
    <div class="blog-grid" id="blog-grid">
    ${posts.map(p => card(p)).join('\n    ')}
    </div>
    <nav class="blog-pager" id="blog-pager" aria-label="Blog pages"></nav>
  </div>
</section>

${ctaBlock('Free Inspection', 'Need a Roof Inspection?', "Not sure what shape your roof is in? We'll inspect it for free and give you an honest, written report. No pressure, no obligation.")}`;
const blogScript = `<script>
(function(){
  var PER = ${PER_PAGE};
  var cards = Array.prototype.slice.call(document.querySelectorAll('#blog-grid .blog-card'));
  var pills = Array.prototype.slice.call(document.querySelectorAll('.blog-pill'));
  var pager = document.getElementById('blog-pager');
  var params = new URLSearchParams(location.search);
  var state = { cat: params.get('cat') || 'all', page: parseInt(params.get('page'), 10) || 1 };
  if (!pills.some(function(p){ return p.dataset.filter === state.cat; })) state.cat = 'all';
  function render(push, scroll){
    var list = cards.filter(function(c){ return state.cat === 'all' || c.dataset.cat === state.cat; });
    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > pages) state.page = pages;
    cards.forEach(function(c){ c.hidden = true; });
    list.slice((state.page - 1) * PER, state.page * PER).forEach(function(c){ c.hidden = false; });
    pills.forEach(function(p){ p.setAttribute('aria-pressed', p.dataset.filter === state.cat ? 'true' : 'false'); });
    var h = '';
    if (pages > 1) {
      if (state.page > 1) h += '<button type="button" class="blog-page" data-page="' + (state.page - 1) + '">&larr; Prev</button>';
      for (var i = 1; i <= pages; i++) h += '<button type="button" class="blog-page" data-page="' + i + '"' + (i === state.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
      if (state.page < pages) h += '<button type="button" class="blog-page" data-page="' + (state.page + 1) + '">Next &rarr;</button>';
    }
    pager.innerHTML = h;
    if (push) {
      var q = new URLSearchParams();
      if (state.cat !== 'all') q.set('cat', state.cat);
      if (state.page > 1) q.set('page', state.page);
      var qs = q.toString();
      history.pushState(state, '', location.pathname + (qs ? '?' + qs : ''));
    }
    if (scroll) document.querySelector('.blog-filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  pills.forEach(function(p){ p.addEventListener('click', function(){ state = { cat: p.dataset.filter, page: 1 }; render(true, false); }); });
  pager.addEventListener('click', function(e){ var b = e.target.closest('[data-page]'); if (!b) return; state = { cat: state.cat, page: +b.dataset.page }; render(true, true); });
  window.addEventListener('popstate', function(){ var q = new URLSearchParams(location.search); state = { cat: q.get('cat') || 'all', page: parseInt(q.get('page'), 10) || 1 }; render(false, false); });
  render(false, false);
})();
</script>
</body>`;
write('blog.html', page({ title: 'Roofing Blog: Houston Roofing Guides & Advice | JD Roofing Solutions',
  description: 'Roofing advice for Houston homeowners: roof replacement costs, leak repair, hail and storm damage, insurance claims, materials, and choosing a roofer.',
  canonical: blogUrl, image: 'Brand_assets/worker.webp', jsonld: blogJsonld, main: blogMain }).replace('</body>', blogScript));

// ---------- Nav on the rest of the site ----------
const sitePages = ['index.html', 'roof-replacement.html', 'roof-repair.html', 'storm-damage.html', 'commercial-roofing.html',
  'insurance-claims.html', 'roof-inspection.html', 'reviews.html', 'financing.html', 'products.html', 'estimate.html', 'city.html'];
for (const f of sitePages) {
  const before = read(f);
  const after = swapNav(before);
  if (!after.includes('href="blog.html" class="nav-link"')) console.warn(`! nav not updated in ${f}`);
  if (after !== before) write(f, after);
}

// ---------- Sitemap + robots ----------
const staticPages = ['', 'roof-replacement.html', 'roof-repair.html', 'storm-damage.html', 'commercial-roofing.html', 'insurance-claims.html',
  'roof-inspection.html', 'reviews.html', 'financing.html', 'products.html', 'estimate.html', 'book.html', 'careers.html', 'blog.html'];
const latest = posts[0].date;
const urls = [
  ...staticPages.map(p => `  <url><loc>${SITE}/${p}</loc>${p === 'blog.html' ? `<lastmod>${latest}</lastmod>` : ''}</url>`),
  ...posts.map(p => `  <url><loc>${SITE}/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>`),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${posts.length} posts, blog.html, sitemap.xml (${urls.length} URLs), robots.txt`);
console.log(posts.map(p => `${String(p.words).padStart(5)}w  ${p.slug}`).join('\n'));
