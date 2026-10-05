import fs from 'fs';
const slugs = process.argv.slice(2);
for (const s of slugs) {
  const html = fs.readFileSync(`${s}.html`, 'utf8');
  const start = html.indexOf('<div class="article"');
  const bodyStart = html.indexOf('>', start) + 1;
  const end = html.indexOf('<!-- CTA -->');
  let body = html.slice(bodyStart, end);
  body = body.replace(/\s*<\/div>\s*<\/section>\s*$/, '').trim();
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].trim();
  const img = html.match(/background-image:url\('([^']*)'\)/)[1];
  fs.writeFileSync(`blog-src/content/${s}.html`, body + '\n');
  console.log(JSON.stringify({ slug: s, title, img, words: body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length }));
}
