const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const sharp = require('sharp');

const SITE_URL = 'https://talentedatai.com';
const GA_ID = 'G-SYQ40F2CXQ';
const ADSENSE_ID = 'ca-pub-3277838203710267';
const DEFAULT_AUTHOR = 'TalentedAtAI Team';
const SITE_NAME = 'TalentedAtAI';
const LOGO_URL = 'https://talentedatai.com/static/images/logo.png';

const publishedDir = path.join(__dirname, '../content/published');

if (!fs.existsSync(publishedDir)) {
  console.log('No published articles yet.');
  process.exit(0);
}

async function generateResponsiveImages(imageFile) {
  if (!imageFile) return;
  const imgDir = path.join(__dirname, '../static/images/articles');
  const srcPath = path.join(imgDir, imageFile);

  if (!fs.existsSync(srcPath)) {
    console.warn('Missing source image: ' + srcPath);
    return;
  }

  const sizes = [400, 800];
  const baseName = imageFile.replace(/\.[^/.]+$/, '');

  for (const size of sizes) {
    // Generate JPEG variant
    const jpgName = `${baseName}-${size}w.jpg`;
    const jpgPath = path.join(imgDir, jpgName);
    if (!fs.existsSync(jpgPath)) {
      await sharp(srcPath)
        .resize(size, null, { withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toFile(jpgPath);
      console.log(`Generated: ${jpgName}`);
    }

    // Generate WebP variant
    const webpName = `${baseName}-${size}w.webp`;
    const webpPath = path.join(imgDir, webpName);
    if (!fs.existsSync(webpPath)) {
      await sharp(srcPath)
        .resize(size, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
      console.log(`Generated: ${webpName}`);
    }
  }

  // Generate full-size WebP
  const fullWebpName = `${baseName}.webp`;
  const fullWebpPath = path.join(imgDir, fullWebpName);
  if (!fs.existsSync(fullWebpPath)) {
    await sharp(srcPath)
      .webp({ quality: 80 })
      .toFile(fullWebpPath);
    console.log(`Generated: ${fullWebpName}`);
  }
}

const mdFiles = fs.readdirSync(publishedDir).filter(f => f.endsWith('.md'));
console.log('Building ' + mdFiles.length + ' article(s)...');

const articles = [];

(async () => {
try {
for (const file of mdFiles) {
  const raw = fs.readFileSync(path.join(publishedDir, file), 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data;
  await generateResponsiveImages(fm.image);
  const content = parsed.content;
  const html = marked.parse(content)
    .replace(/<table([\s\S]*?<\/table>)/g, '<div class="table-scroll"><table$1</div>');

  // --- TOC generation: parse H2 headings ---
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const tocItems = [];
  const usedSlugs = {};
  const h2Matches = [];
  let h2Match;
  while ((h2Match = h2Regex.exec(html)) !== null) {
    h2Matches.push({ full: h2Match[0], inner: h2Match[1] });
  }
  for (const m of h2Matches) {
    const headingText = m.inner.replace(/<[^>]+>/g, '').trim();
    let hSlug = headingText.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
    if (usedSlugs[hSlug]) { usedSlugs[hSlug]++; hSlug += '-' + usedSlugs[hSlug]; }
    else { usedSlugs[hSlug] = 1; }
    tocItems.push({ id: hSlug, text: headingText, original: m.full, inner: m.inner });
  }
  let articleContentHtml = html;
  for (const item of tocItems) {
    articleContentHtml = articleContentHtml.replace(item.original, '<h2 id="' + item.id + '">' + item.inner + '</h2>');
  }
  const hasToc = tocItems.length >= 3;
  const tocListHtml = tocItems.map(function(item) {
    return '<li class="toc-item"><a class="toc-link" href="#' + item.id + '">' + item.text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</a></li>';
  }).join('');

  const slug = file.replace('.md', '');

  articles.push({
    slug,
    title: fm.title || slug,
    description: fm.description || '',
    category: fm.category || 'General',
    filters: fm.filters || [],
    date: fm.date || '',
    date_modified: fm.date_modified || '',
    author: fm.author || DEFAULT_AUTHOR,
    read_time: fm.read_time || (Math.ceil(content.split(' ').length / 200) + ' min'),
    tags: fm.tags || [],
    image: fm.image ? '/static/images/articles/' + fm.image : null
  });

  const readTime = fm.read_time || (Math.ceil(content.split(' ').length / 200) + ' min read');

  const articlePage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${fm.title || slug} | ${SITE_NAME}</title>
  <link rel="canonical" href="${SITE_URL}/content/published/${slug}">
  ${fm.image ? `<link rel="preload" as="image" type="image/webp" imagesrcset="/static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-400w.webp 400w, /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-800w.webp 800w, /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}.webp 1600w" imagesizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1600px">` : ''}
  <meta name="description" content="${fm.description}">
  <meta property="og:title" content="${fm.title} — ${SITE_NAME}">
  <meta property="og:description" content="${fm.description}">
  <meta property="og:url" content="${SITE_URL}/content/published/${slug}">
  <meta property="og:type" content="article">
  ${fm.image ? `<meta property="og:image" content="${SITE_URL}/static/images/articles/${fm.image}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fm.title} — ${SITE_NAME}">
  <meta name="twitter:description" content="${fm.description}">
  ${fm.image ? `<meta name="twitter:image" content="${SITE_URL}/static/images/articles/${fm.image}">` : ''}
  <meta name="robots" content="index, follow">
  <meta name="author" content="${fm.author || DEFAULT_AUTHOR}"/>
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="article:published_time" content="${fm.date}">
  ${fm.faq && Array.isArray(fm.faq) ? `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ${JSON.stringify(fm.faq.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": { "@type": "Answer", "text": q.a }
    }))).replace(/</g, '\\u003c')}
  }
  </script>` : ''}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${(fm.title || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
    "description": "${(fm.description || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
    ${fm.image ? `"image": "${SITE_URL}/static/images/articles/${fm.image}",` : ''}
    "datePublished": "${fm.date}",
    "dateModified": "${fm.date_modified || fm.date}",
    "author": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}",
      "logo": {
        "@type": "ImageObject",
        "url": "${LOGO_URL}"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${SITE_URL}/content/published/${slug}"
    }${fm.audio_url ? `,
    "audio": {
      "@type": "AudioObject",
      "contentUrl": "${fm.audio_url}",
      "encodingFormat": "audio/mpeg",
      "name": "Audio version of ${(fm.title || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
    }` : ''}
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "${SITE_URL}"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${((Array.isArray(fm.filters) && fm.filters.length > 0 ? fm.filters[0] : fm.category) || 'General').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
        "item": "${SITE_URL}/articles.html?filter=${((Array.isArray(fm.filters) && fm.filters.length > 0 ? fm.filters[0] : fm.category) || 'General').toLowerCase().replace(/\s+/g, '-')}"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${(fm.title || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
        "item": "${SITE_URL}/content/published/${slug}"
      }
    ]
  }
  </script>
  <script>(function(){var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)})()</script>
  <style>
    @font-face{font-family:'DM Sans';font-style:normal;font-weight:300 600;font-display:optional;src:url(/static/fonts/dm-sans-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'DM Sans';font-style:italic;font-weight:400;font-display:optional;src:url(/static/fonts/dm-sans-italic-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'Syne';font-style:normal;font-weight:400 800;font-display:optional;src:url(/static/fonts/syne-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'Syne Fallback';src:local('Arial Black'),local('Arial');size-adjust:97%;ascent-override:105%;descent-override:30%;line-gap-override:0%}
    @font-face{font-family:'DM Sans Fallback';src:local('Arial'),local('Helvetica');size-adjust:105%;ascent-override:95%;descent-override:25%;line-gap-override:0%}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --blue:#0066ff;
      --blue-light:#e6f0ff;
      --blue-mid:#3385ff;
      --dark:#0d0d1a;
      --gray-700:#3d3d5c;
      --gray-500:#6b6b8a;
      --gray-300:#b8b8d0;
      --gray-100:#f4f4f8;
      --white:#ffffff;
      --font-head:'Syne','Syne Fallback',sans-serif;
      --font-body:'DM Sans','DM Sans Fallback',sans-serif;
      --radius:16px;
      --transition:0.25s cubic-bezier(0.4,0,0.2,1);
      /* Legacy aliases used by article body styles */
      --text:#1a1a18;
      --gray-400:#9a9a95;
      --gray-600:#5a5a55;
      --gray-200:#e8e8e5;
      --blue-light-legacy:#e8f0ff;
    }
    [data-theme="dark"]{
      --white:#0d0d1a;--dark:#f0f0f5;--gray-100:#1a1a2e;--gray-200:#252538;
      --gray-300:#4a4a6a;--gray-500:#8888aa;--gray-700:#ccccdd;
      --blue:#4d9fff;--blue-light:#1a2940;--blue-mid:#6ab0ff;
      --text:#e0e0f0;--gray-400:#7a7a9a;--gray-600:#aaaacc;
      --blue-light-legacy:#1a2940;
    }
    body{font-family:var(--font-body);color:var(--dark);background:var(--white);line-height:1.7;-webkit-font-smoothing:antialiased}
    a{color:var(--blue);text-decoration:none}
    a:hover{text-decoration:underline}
    /* NAV */
    .nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,102,255,0.08)}
    .nav__inner{max-width:1200px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;gap:32px}
    .nav__logo{font-family:var(--font-head);font-size:20px;font-weight:800;color:var(--dark);letter-spacing:-0.02em;display:flex;align-items:center;gap:6px;text-decoration:none}
    .nav__logo:hover{text-decoration:none}
    .nav__logo span{color:var(--blue)}
    .nav__logo-dot{width:8px;height:8px;background:var(--blue);border-radius:50%;display:inline-block}
    .nav__links{display:flex;align-items:center;gap:32px;list-style:none}
    .nav__links a{font-size:14px;font-weight:500;color:var(--gray-700);transition:color var(--transition);text-decoration:none}
    .nav__links a:hover{color:var(--blue);text-decoration:none}
    /* NAV SEARCH */
    .nav-search{position:relative;display:flex;align-items:center;gap:6px}
    .nav-search__input{width:0;opacity:0;padding:0;margin:0;border:none;border-bottom:1.5px solid transparent;background:transparent;font-family:var(--font-body);font-size:14px;font-weight:500;color:var(--dark);outline:none;transition:width 200ms ease,opacity 200ms ease,border-color 200ms ease,padding 200ms ease;pointer-events:none;min-width:0}
    .nav-search__input::placeholder{color:var(--gray-300)}
    .nav-search.open .nav-search__input{width:220px;opacity:1;padding:4px 2px;border-bottom-color:var(--blue);pointer-events:auto}
    .nav-search__toggle{display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;padding:4px;color:var(--gray-700);transition:color var(--transition)}
    .nav-search__toggle:hover{color:var(--blue)}
    .nav-search.open .nav-search__toggle{color:var(--blue)}
    .nav-search__toggle svg{display:block}
    .nav-search__drawer{display:none}
    .nav__logo-wrap{display:flex;flex-direction:column;gap:1px}
    .nav__tagline{font-size:11px;color:var(--gray-500);font-family:var(--font-body);font-weight:400;letter-spacing:0.01em}
    .nav__cta{font-size:12px;font-weight:600;color:var(--blue);border:1px solid var(--blue);border-radius:20px;padding:5px 14px;white-space:nowrap;transition:all var(--transition)}
    .nav__cta:hover{background:var(--blue);color:var(--white)}
    @media(max-width:900px){.nav__tagline{display:none}.nav__cta{display:none}}
    /* HAMBURGER + MOBILE MENU */
    .nav__hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:8px;margin-left:auto}
    .nav__hamburger span{display:block;width:22px;height:2px;background:var(--dark);border-radius:2px;transition:all 0.25s ease}
    .nav__hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
    .nav__hamburger.open span:nth-child(2){opacity:0}
    .nav__hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
    .nav__mobile-menu{display:none;position:absolute;top:56px;left:0;right:0;background:rgba(255,255,255,0.98);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,102,255,0.08);padding:16px 24px;flex-direction:column;gap:0;z-index:99}
    .nav__mobile-menu a{font-size:15px;font-weight:500;color:var(--gray-700);padding:12px 0;border-bottom:1px solid var(--gray-100);display:block;transition:color 0.2s;text-decoration:none}
    .nav__mobile-menu a:last-child{border-bottom:none}
    .nav__mobile-menu a:hover{color:var(--blue)}
    .nav__mobile-menu.open{display:flex}
    @media(max-width:768px){
      .nav__links{display:none}
      .nav__hamburger{display:flex}
      .nav-search.open .nav-search__input{width:0;opacity:0;padding:0;border-bottom-color:transparent;pointer-events:none}
      .nav-search__drawer{display:block;max-height:0;overflow:hidden;background:var(--white);border-bottom:1px solid transparent;padding:0 16px;transition:max-height 200ms ease,padding 200ms ease,border-color 200ms ease}
      .nav-search__drawer.open{max-height:80px;padding:12px 16px;border-bottom-color:rgba(0,102,255,0.08)}
      .nav-search__drawer-input{width:100%;font-family:var(--font-body);font-size:15px;font-weight:500;color:var(--dark);background:transparent;border:none;border-bottom:1.5px solid var(--blue);padding:6px 2px;margin:0;outline:none;-webkit-appearance:none;appearance:none}
      .nav-search__drawer-input::placeholder{color:var(--gray-300)}
      .nav-search__drawer-input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}
    }
    .article-hero{max-width:760px;margin:0 auto;padding:64px 24px 48px}
    .category-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 14px;border-radius:100px;background:var(--blue-light);color:var(--blue);margin-bottom:20px}
    .article-meta{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--gray-400);margin-bottom:24px;flex-wrap:wrap}
    .article-hero h1{font-family:'Syne','Syne Fallback',sans-serif;font-size:clamp(30px,5vw,48px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:20px;color:var(--dark)}
    .article-desc{font-size:18px;color:var(--gray-600);line-height:1.65;font-weight:300;padding-bottom:40px;border-bottom:1px solid var(--gray-200)}
    .article-body{max-width:760px;margin:0 auto;padding:48px 24px 96px}
    .article-body h2{font-family:'Syne','Syne Fallback',sans-serif;font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.2;margin:56px 0 16px;color:var(--dark)}
    .article-body h3{font-family:'Syne','Syne Fallback',sans-serif;font-size:21px;font-weight:700;margin:40px 0 12px;color:var(--dark)}
    .article-body h4{font-family:'Syne','Syne Fallback',sans-serif;font-size:17px;font-weight:700;margin:28px 0 8px;color:var(--dark)}
    .article-body p{margin-bottom:24px;font-size:17px;color:#2a2a28;line-height:1.8}
    .article-body ul,.article-body ol{margin:0 0 28px 0;padding:0;list-style:none}
    .article-body ul li{font-size:17px;color:#2a2a28;margin-bottom:10px;padding-left:22px;position:relative;line-height:1.7}
    .article-body ul li::before{content:'→';position:absolute;left:0;color:var(--blue);font-weight:500}
    .article-body ol{counter-reset:ol-counter}
    .article-body ol li{font-size:17px;color:#2a2a28;margin-bottom:10px;padding-left:28px;position:relative;line-height:1.7;counter-increment:ol-counter}
    .article-body ol li::before{content:counter(ol-counter) '.';position:absolute;left:0;color:var(--blue);font-weight:600}
    .article-body strong{color:var(--dark);font-weight:600}
    .article-body em{font-style:italic;color:var(--gray-600)}
    .article-body hr{border:none;border-top:1px solid var(--gray-200);margin:48px 0}
    .article-body blockquote{border-left:3px solid var(--blue);padding:16px 24px;background:var(--blue-light);border-radius:0 12px 12px 0;margin:32px 0;font-size:17px;color:var(--gray-600);font-style:italic}
    .article-body code{background:var(--gray-100);padding:2px 8px;border-radius:6px;font-size:14px;font-family:monospace;color:var(--dark)}
    .article-body pre{background:var(--dark);color:#e8e8e5;padding:24px;border-radius:12px;overflow-x:auto;margin:28px 0;font-size:14px;line-height:1.6}
    .article-body pre code{background:none;padding:0;color:inherit}
    /* AUTHOR BIO */
    .author-bio{display:flex;align-items:flex-start;gap:16px;background:var(--gray-100);border-radius:var(--radius);padding:24px;margin:0 0 0}
    .author-bio__avatar{width:48px;height:48px;border-radius:50%;background:var(--blue);color:#fff;font-family:var(--font-head);font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .author-bio__content{flex:1;min-width:0}
    .author-bio__name{font-family:var(--font-head);font-size:15px;font-weight:700;color:var(--dark);margin-bottom:4px}
    .author-bio__text{font-family:var(--font-body);font-size:14px;color:var(--gray-500);line-height:1.6;margin:0}
    .table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:28px 0;border-radius:8px;position:relative;border:1px solid var(--gray-200)}
    .table-scroll::after{content:'';position:absolute;top:0;right:0;width:40px;height:100%;background:linear-gradient(to right,transparent,var(--white));pointer-events:none;border-radius:0 8px 8px 0}
    @media(max-width:768px){.table-scroll::before{content:'Scroll to see more →';display:block;font-size:11px;color:var(--gray-500);text-align:right;padding:4px 8px 0;font-family:var(--font-body)}}
    .table-scroll table{margin:0}
    .article-body table{width:100%;border-collapse:collapse;margin:28px 0;font-size:15px;min-width:480px}
    .article-body th{font-family:'Syne','Syne Fallback',sans-serif;font-weight:700;text-align:left;padding:12px 16px;background:var(--gray-100);border-bottom:2px solid var(--gray-200)}
    .article-body td{padding:12px 16px;border-bottom:1px solid var(--gray-200);color:#2a2a28}
    .article-body tr:last-child td{border-bottom:none}
    /* FOOTER */
    .footer{background:var(--dark);color:rgba(255,255,255,0.7);padding:64px 24px 32px}
    .footer__inner{max-width:1200px;margin:0 auto}
    .footer__top{display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px;margin-bottom:48px}
    .footer__brand-logo{font-family:var(--font-head);font-size:20px;font-weight:800;color:#fff;margin-bottom:14px}
    .footer__brand-logo span{color:var(--blue)}
    .footer__brand-desc{font-size:14px;line-height:1.7;max-width:280px}
    .footer__col-title{font-family:var(--font-head);font-size:13px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px}
    .footer__links{list-style:none;display:flex;flex-direction:column;gap:12px}
    .footer__links a{font-size:14px;color:rgba(255,255,255,0.55);transition:color var(--transition);text-decoration:none}
    .footer__links a:hover{color:#fff}
    .footer__bottom{display:flex;align-items:center;justify-content:space-between;padding-top:32px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px}
    .footer__bottom-links{display:flex;gap:24px}
    .footer__bottom-links a{color:rgba(255,255,255,0.4);transition:color var(--transition);text-decoration:none}
    .footer__bottom-links a:hover{color:#fff}
    @media(max-width:1024px){.footer__top{grid-template-columns:1fr 1fr}}
    @media(max-width:768px){.footer__top{grid-template-columns:1fr}.footer__bottom{flex-direction:column;gap:16px;text-align:center}}
    @media(max-width:640px){.article-hero{padding:40px 20px 32px}.article-body{padding:32px 20px 64px}}
    .audio-player { margin: 24px 0 36px; width: 100%; max-width: 100%; box-sizing: border-box; }
    .audio-player__inner { display: flex; align-items: center; gap: 14px; background: #eeeee8; border: 1.5px solid #e0e0da; border-radius: 12px; padding: 14px 18px; width: 100%; box-sizing: border-box; }
    .audio-btn { width: 42px; height: 42px; border-radius: 50%; background: #0066ff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; transition: background 0.2s, transform 0.15s; }
    .audio-btn:hover { background: #0052cc; transform: scale(1.05); }
    .audio-player__content { flex: 1; min-width: 0; }
    .audio-player__label { font-size: 13px; font-weight: 600; color: #0a0a0a; margin: 0 0 8px; font-family: 'DM Sans', sans-serif; }
    .audio-player__duration { font-weight: 400; color: #888; }
    .audio-player__bar { background: #e0e0da; border-radius: 4px; height: 4px; cursor: pointer; position: relative; }
    .audio-player__progress { background: #0066ff; height: 4px; border-radius: 4px; width: 0%; transition: width 0.1s linear; pointer-events: none; }
    .audio-player__time { font-size: 12px; color: #888; flex-shrink: 0; font-family: 'DM Sans', sans-serif; min-width: 32px; text-align: right; }
    .audio-credit { font-size: 12px; color: #888; margin: -28px 0 36px; font-family: 'DM Sans', sans-serif; }
    .audio-credit a { color: #0066ff; text-decoration: none; }
    .audio-credit a:hover { text-decoration: underline; }
    .affiliate-notice { font-size: 12px; color: #888; background: #f4f4f0; border-left: 3px solid #e0e0da; padding: 8px 12px; border-radius: 0 6px 6px 0; margin: 0 0 24px; font-family: 'DM Sans', sans-serif; line-height: 1.5; }
    /* TABLE OF CONTENTS */
    .article-toc-wrapper{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:1fr 240px;gap:40px;padding:0 20px}
    .article-toc-wrapper .article-body{max-width:760px;margin:0;padding:48px 24px 96px}
    .toc-sidebar{padding-top:48px}
    .toc-sticky{position:sticky;top:100px;opacity:0;transition:opacity 0.4s ease}
    .toc-sticky.visible{opacity:1}
    .toc-heading{font-family:var(--font-head);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:16px}
    .toc-list{list-style:none;border-left:2px solid var(--gray-100);padding:0;margin:0}
    .toc-item{margin:0}
    .toc-link{display:block;padding:4px 0 4px 16px;margin-left:-2px;border-left:2px solid transparent;font-family:var(--font-body);font-size:13px;color:var(--gray-700);text-decoration:none;line-height:1.5;margin-bottom:8px;transition:color 0.2s,border-color 0.2s,font-weight 0.2s}
    .toc-link:hover{color:var(--blue);text-decoration:none}
    .toc-link.active{color:var(--blue);font-weight:500;border-left-color:var(--blue)}
    @media(max-width:1100px){.article-toc-wrapper{display:block;max-width:760px;padding:0}.toc-sidebar{display:none}}
  
/* DARK MODE TOGGLE — sliding pill */
    .theme-toggle{background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center}
    .theme-toggle__track{width:52px;height:26px;border-radius:13px;background:var(--gray-200,#e8e8e5);border:1.5px solid var(--gray-300);position:relative;display:flex;align-items:center;transition:background 200ms ease,border-color 200ms ease}
    .theme-toggle__thumb{width:20px;height:20px;border-radius:50%;background:white;position:absolute;left:2px;transition:transform 200ms ease,background 200ms ease;box-shadow:0 1px 3px rgba(0,0,0,0.2)}
    .theme-toggle__moon{position:absolute;right:4px;font-size:12px;line-height:1}
    .theme-toggle__sun{position:absolute;left:4px;font-size:12px;line-height:1;opacity:0.4}
    [data-theme="dark"] .theme-toggle__track{background:#1e3a5f;border-color:#4d9fff}
    [data-theme="dark"] .theme-toggle__thumb{transform:translateX(26px);background:#4d9fff}
    [data-theme="dark"] .theme-toggle__sun{opacity:1}
    [data-theme="dark"] .theme-toggle__moon{opacity:0.4}
    /* DARK OVERRIDES — article pages */
    [data-theme="dark"] .nav{background:rgba(13,13,26,0.95);border-bottom-color:rgba(77,159,255,0.08)}
    [data-theme="dark"] .nav__mobile-menu{background:rgba(13,13,26,0.98);border-bottom-color:rgba(77,159,255,0.08)}
    [data-theme="dark"] .nav-search__drawer{background:var(--white)}
    [data-theme="dark"] .footer{background:#111128;border-top:1px solid rgba(255,255,255,0.06)}
    [data-theme="dark"] .newsletter-section{background:#060612}
    [data-theme="dark"] .newsletter-input{background:#1a1a2e;color:#e8e8f0;border-color:#252538}
    [data-theme="dark"] .newsletter-input::placeholder{color:#6a6a8a}
    [data-theme="dark"] .article-body a{color:#7db8ff !important}
    [data-theme="dark"] .article-body blockquote{border-left-color:#4d9fff;background:#1a1a2e !important;color:#c8c8e8 !important}
    [data-theme="dark"] .article-body code{background:#1a1a2e !important;color:#e0e0f0 !important}
    [data-theme="dark"] .article-body pre{background:#1a1a2e;color:#e8e8f0}
    [data-theme="dark"] .article-body img{opacity:0.9}
    [data-theme="dark"] .table-scroll{border-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .table-scroll::after{background:linear-gradient(to right,transparent,#0d0d1a)}
    [data-theme="dark"] .article-body table{border-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .article-body th{background:#1a1a2e !important;color:#e0e0f0 !important}
    [data-theme="dark"] .article-body td{border-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .category-pill{background:rgba(77,159,255,0.12);color:#7db8ff;border:1px solid rgba(77,159,255,0.2)}
    [data-theme="dark"] .author-bio{border-top-color:rgba(255,255,255,0.07);border-bottom-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .related-grid .feed-card{border-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .toc-sidebar{border-left-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] #progress-bar{background:#4d9fff}

    [data-theme="dark"] .article-meta{color:#9999bb}
    [data-theme="dark"] .article-desc{color:#9999bb;border-bottom-color:rgba(255,255,255,0.07)}
    [data-theme="dark"] .article-body img{border:1px solid rgba(255,255,255,0.08);border-radius:8px}
    [data-theme="dark"] .related-grid .feed-card__thumb img{border:1px solid rgba(255,255,255,0.08);border-radius:inherit}
    [data-theme="dark"] h1,[data-theme="dark"] h2,[data-theme="dark"] h3{color:#f0f0ff}
    [data-theme="dark"] .article-body{color:#e0e0f0 !important}
    [data-theme="dark"] .article-body p,[data-theme="dark"] .article-body li,[data-theme="dark"] .article-body td,[data-theme="dark"] .article-body th{color:#e0e0f0 !important}
    [data-theme="dark"] .article-body h2,[data-theme="dark"] .article-body h3,[data-theme="dark"] .article-body h4{color:#f0f0ff !important}
    [data-theme="dark"] .article-body blockquote{background:#1a1a2e !important;border-left-color:#4d9fff;color:#c8c8e8 !important}
    [data-theme="dark"] .article-body blockquote p,[data-theme="dark"] .article-body blockquote li{color:#c8c8e8 !important}
    [data-theme="dark"] .article-body strong{color:#f0f0ff !important}
    [data-theme="dark"] .article-body a{color:#7db8ff !important}
    [data-theme="dark"] .article-body div[style*="background:#f0f6ff"],[data-theme="dark"] .article-body div[style*="background: #f0f6ff"]{background:#1a2a3a !important;border-color:#4d9fff !important}
    [data-theme="dark"] .article-body div[style*="background:#f0f6ff"] p,[data-theme="dark"] .article-body div[style*="background: #f0f6ff"] p{color:#c8d8f0 !important}
    [data-theme="dark"] .article-body div[style*="background:#f0f6ff"] a[style*="background:#0066ff"],[data-theme="dark"] .article-body div[style*="background: #f0f6ff"] a[style*="background:#0066ff"]{color:#fff !important;background:#4d9fff !important}
    [data-theme="dark"] .footer__brand-logo{color:#f0f0f5}
    [data-theme="dark"] .footer__brand-logo span{color:#4d9fff}
    body{transition:background-color 200ms ease,color 200ms ease}
    .cookie-banner{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--gray-200);padding:16px 24px;z-index:9999;box-shadow:0 -4px 24px rgba(0,0,0,0.08);display:none}
    .cookie-banner.visible{display:block}
    .cookie-banner__inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
    .cookie-banner__text{font-family:var(--font-body);font-size:14px;color:var(--gray-700);margin:0}
    .cookie-banner__text a{color:var(--blue);text-decoration:underline}
    .cookie-banner__actions{display:flex;gap:12px;flex-shrink:0}
    .cookie-banner__decline{font-family:var(--font-body);font-size:14px;padding:8px 20px;border-radius:var(--radius, 8px);border:1.5px solid var(--gray-300);background:transparent;color:var(--gray-700);cursor:pointer;transition:border-color 200ms ease}
    .cookie-banner__decline:hover{border-color:var(--blue)}
    .cookie-banner__accept{font-family:var(--font-body);font-size:14px;padding:8px 20px;border-radius:var(--radius, 8px);border:none;background:var(--blue);color:#fff;cursor:pointer;transition:opacity 200ms ease}
    .cookie-banner__accept:hover{opacity:0.9}
    [data-theme="dark"] .cookie-banner{background:#13132a;border-top-color:rgba(255,255,255,0.08)}
    </style>
</head>
<body>
<div id="progress-bar" style="position:fixed;top:0;left:0;height:3px;background:#0066ff;width:0%;z-index:9999;transition:width 0.1s;"></div>
<script>
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    document.getElementById('progress-bar').style.width = progress + '%';
  });
</script>
<nav class="nav">
  <div class="nav__inner">
    <div class="nav__logo-wrap">
      <a href="${SITE_URL}" class="nav__logo">
        <span class="nav__logo-dot"></span>
        Talented<span>At</span>AI
      </a>
      <div class="nav__tagline">Practical guides, honest reviews · Independent</div>
    </div>
    <ul class="nav__links">
      <li><a href="${SITE_URL}/articles.html">Articles</a></li>
      <li><a href="${SITE_URL}/about.html">About</a></li>
      <li><a href="${SITE_URL}/contact.html">Contact</a></li>
      <li><a href="${SITE_URL}/privacy-policy.html">Privacy Policy</a></li>
    </ul>
    <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode" role="switch"><span class="theme-toggle__track"><span class="theme-toggle__thumb"></span><span class="theme-toggle__moon">🌙</span><span class="theme-toggle__sun">☀️</span></span></button>
    <div class="nav-search" id="nav-search">
      <input type="search" id="nav-search-input" class="nav-search__input" placeholder="Search articles..." aria-label="Search articles" autocomplete="off" spellcheck="false" tabindex="-1" oninput="onNavSearchInput(event)" onkeydown="onNavSearchKeydown(event)" onblur="onNavSearchBlur(event)">
      <button type="button" class="nav-search__toggle" aria-label="Search" onclick="toggleNavSearch()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M14 14l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <a href="${SITE_URL}/#newsletter" class="nav__cta">Get free guide →</a>
    <button class="nav__hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-mobile-menu" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </button>
    <div class="nav__mobile-menu" id="nav-mobile-menu">
      <a href="${SITE_URL}/articles.html">Articles</a>
      <a href="${SITE_URL}/about.html">About</a>
      <a href="${SITE_URL}/contact.html">Contact</a>
      <a href="${SITE_URL}/privacy-policy.html">Privacy Policy</a>
    </div>
  </div>
  <div class="nav-search__drawer" id="nav-search-drawer">
    <input type="search" id="nav-search-drawer-input" class="nav-search__drawer-input" placeholder="Search articles..." aria-label="Search articles" autocomplete="off" spellcheck="false" oninput="onNavSearchInput(event)" onkeydown="onNavSearchKeydown(event)">
  </div>
</nav>
<div class="article-hero">
  <span class="category-pill">${fm.category || 'General'}</span>
  <div class="article-meta">
    <span>${fm.author || DEFAULT_AUTHOR}</span>
    <span>·</span>
    <span>${fm.date ? new Date(fm.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
    <span>·</span>
    <span>${readTime}</span>
  </div>
  <h1>${fm.title || ''}</h1>
  <p style="color:#5a5a55;font-size:0.9em;margin:4px 0 24px 0;">
    Last updated: ${(fm.date_modified || fm.date) ? new Date(fm.date_modified || fm.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
  </p>
  <p class="article-desc">${fm.description || ''}</p>
${fm.affiliate ? `<p class="affiliate-notice">This article contains affiliate links. If you purchase through these links we may earn a commission at no extra cost to you.</p>` : ''}
${fm.audio_url ? `
<div class="audio-player" role="region" aria-label="Audio version of this article">
  <audio id="article-audio" src="${fm.audio_url}" preload="metadata"></audio>
  <div class="audio-player__inner">
    <button class="audio-btn" onclick="toggleAudio()" aria-label="Play audio" id="audio-btn">
      <svg class="audio-icon" id="play-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M4 2.5l11 6.5-11 6.5z"/></svg>
      <svg class="audio-icon" id="pause-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true" style="display:none"><rect x="3" y="2" width="4" height="14" rx="1"/><rect x="11" y="2" width="4" height="14" rx="1"/></svg>
    </button>
    <div class="audio-player__content">
      <div class="audio-player__label">🎧 Listen to the audio summary <span class="audio-player__duration" id="audio-duration"></span></div>
      <div class="audio-player__bar" onclick="seekAudio(event, this)" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="audio-player__progress" id="audio-progress"></div>
      </div>
    </div>
    <span class="audio-player__time" id="audio-time">0:00</span>
  </div>
</div>
${fm.audio_url ? `<p class="audio-credit">Audio summary by <a href="https://try.elevenlabs.io/ihsithj42jfj" target="_blank" rel="noopener">ElevenLabs</a> — try it free</p>` : ''}
<script>
(function(){
  var a=document.getElementById('article-audio');
  var prog=document.getElementById('audio-progress');
  var time=document.getElementById('audio-time');
  var dur=document.getElementById('audio-duration');
  var btn=document.getElementById('audio-btn');
  a.addEventListener('loadedmetadata',function(){
    var m=Math.floor(a.duration/60);
    var s=Math.floor(a.duration%60);
    dur.textContent='· '+(m+':'+(s<10?'0':'')+s)+' min';
  });
  a.addEventListener('timeupdate',function(){
    var pct=a.duration?(a.currentTime/a.duration)*100:0;
    prog.style.width=pct+'%';
    document.querySelector('.audio-player__bar').setAttribute('aria-valuenow',Math.round(pct));
    var m=Math.floor(a.currentTime/60);
    var s=Math.floor(a.currentTime%60);
    time.textContent=m+':'+(s<10?'0':'')+s;
  });
  a.addEventListener('ended',function(){
    document.getElementById('play-icon').style.display='block';
    document.getElementById('pause-icon').style.display='none';
    btn.setAttribute('aria-label','Play audio');
    prog.style.width='0%';
    time.textContent='0:00';
  });
  window.toggleAudio=function(){
    var play=document.getElementById('play-icon');
    var pause=document.getElementById('pause-icon');
    if(a.paused){
      a.play();
      play.style.display='none';
      pause.style.display='block';
      btn.setAttribute('aria-label','Pause audio');
    } else {
      a.pause();
      play.style.display='block';
      pause.style.display='none';
      btn.setAttribute('aria-label','Play audio');
    }
  };
  window.seekAudio=function(e,bar){
    var rect=bar.getBoundingClientRect();
    var pct=(e.clientX-rect.left)/rect.width;
    if(a.duration) a.currentTime=pct*a.duration;
  };
})();
</script>` : ''}
${fm.image ? `
<div style="margin-top:32px;border-radius:16px;overflow:hidden;max-height:420px;">
  <picture>
    <source
      type="image/webp"
      srcset="/static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-400w.webp 400w,
              /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-800w.webp 800w,
              /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}.webp 1600w"
      sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1600px">
    <img
      src="/static/images/articles/${fm.image}"
      srcset="/static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-400w.jpg 400w,
              /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-800w.jpg 800w,
              /static/images/articles/${fm.image} 1600w"
      sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1600px"
      alt="${fm.image_alt || fm.title || ''}"
      width="760"
      height="420"
      fetchpriority="high"
      style="width:100%;height:420px;object-fit:cover;display:block;"
    />
  </picture>
</div>` : ''}
</div>
${hasToc ? '<div class="article-toc-wrapper">' : ''}
<div class="article-body">
${hasToc ? articleContentHtml : html}
</div>
${hasToc ? `<nav class="toc-sidebar" aria-label="Table of contents">
  <div class="toc-sticky">
    <div class="toc-heading">Contents</div>
    <ul class="toc-list">${tocListHtml}</ul>
  </div>
</nav>
</div>` : ''}
<div style="max-width:760px;margin:0 auto;padding:0 24px 48px;">
  <div class="author-bio">
    <div class="author-bio__avatar">TA</div>
    <div class="author-bio__content">
      <div class="author-bio__name">TalentedAtAI Editorial Team</div>
      <div class="author-bio__text">We research, test and review AI tools so you can make smarter decisions about what to use, what to skip, and what's worth paying for. Independent, editorially driven, and never paid to rank a tool.</div>
    </div>
  </div>
  <div style="border-top:1px solid #e8e8e5;margin-top:48px;padding-top:24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
    <span style="font-family:'DM Sans',sans-serif;color:#5a5a55;font-size:15px;">Found this useful?</span>
    <a href="https://x.com/intent/tweet?text=${encodeURIComponent(fm.title + ' — via @talentedat\n' + SITE_URL + '/content/published/' + slug)}"
       target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;gap:6px;background:#000;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      Share on X
    </a>
    <a href="https://x.com/talentedat" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;gap:6px;color:#5a5a55;font-size:14px;text-decoration:none;">
      Follow @talentedat
    </a>
  </div>
</div>
<footer class="footer">
  <div class="footer__inner">
    <div class="footer__top">
      <div>
        <div class="footer__brand-logo">Talented<span>At</span>AI</div>
        <p class="footer__brand-desc">Your practical guide to the best AI tools, strategies, and workflows. Independent, honest, and updated daily.</p>
      </div>
      <div>
        <div class="footer__col-title">Articles</div>
        <ul class="footer__links">
          <li><a href="${SITE_URL}/articles.html">Latest Articles</a></li>
        </ul>
      </div>
      <div>
        <div class="footer__col-title">Company</div>
        <ul class="footer__links">
          <li><a href="${SITE_URL}/about.html">About Us</a></li>
          <li><a href="${SITE_URL}/contact.html">Contact</a></li>
          <li><a href="${SITE_URL}/privacy-policy.html">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>&copy; 2026 ${SITE_NAME}. All rights reserved.</span>
      <div class="footer__bottom-links">
        <a href="${SITE_URL}/privacy-policy.html">Privacy Policy</a>
        <a href="${SITE_URL}/about.html">About</a>
        <a href="${SITE_URL}/contact.html">Contact</a>
        <a href="https://x.com/talentedat" target="_blank" rel="noopener">@talentedat</a>
      </div>
    </div>
  </div>
</footer>
<script>
  // HAMBURGER MENU
  function toggleMenu(){
    var btn=document.getElementById('nav-hamburger');
    var menu=document.getElementById('nav-mobile-menu');
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    btn.setAttribute('aria-expanded',menu.classList.contains('open')?'true':'false');
  }
  // NAV SEARCH
  var navSearchRedirectTimer=null;
  var navSearchBlurTimer=null;
  function isMobileNavViewport(){return typeof window.matchMedia==='function'&&window.matchMedia('(max-width:768px)').matches;}
  function toggleNavSearch(){if(isMobileNavViewport()){toggleMobileDrawer();}else{toggleInlineSearch();}}
  function toggleInlineSearch(){
    var wrap=document.getElementById('nav-search');
    var input=document.getElementById('nav-search-input');
    if(!wrap||!input)return;
    if(wrap.classList.contains('open')){closeNavSearch();}else{wrap.classList.add('open');setTimeout(function(){input.focus();},10);}
  }
  function toggleMobileDrawer(){
    var drawer=document.getElementById('nav-search-drawer');
    var drawerInput=document.getElementById('nav-search-drawer-input');
    if(!drawer||!drawerInput)return;
    if(drawer.classList.contains('open')){closeNavSearch();}else{drawer.classList.add('open');setTimeout(function(){drawerInput.focus();},10);}
  }
  function closeNavSearch(){
    var wrap=document.getElementById('nav-search');
    var input=document.getElementById('nav-search-input');
    var drawer=document.getElementById('nav-search-drawer');
    var drawerInput=document.getElementById('nav-search-drawer-input');
    if(wrap)wrap.classList.remove('open');
    if(input)input.value='';
    if(drawer)drawer.classList.remove('open');
    if(drawerInput)drawerInput.value='';
    clearTimeout(navSearchRedirectTimer);
    clearTimeout(navSearchBlurTimer);
  }
  function submitNavSearch(q){var t=(q||'').trim();if(!t)return;window.location.href='/articles.html?search='+encodeURIComponent(t);}
  function onNavSearchInput(e){clearTimeout(navSearchRedirectTimer);}
  function onNavSearchKeydown(e){
    if(e.key==='Enter'||e.keyCode===13){e.preventDefault();clearTimeout(navSearchRedirectTimer);if(e.target.value.trim())submitNavSearch(e.target.value);}
    else if(e.key==='Escape'||e.keyCode===27){e.preventDefault();closeNavSearch();}
  }
  function onNavSearchBlur(e){
    clearTimeout(navSearchBlurTimer);
    var input=e.target;
    navSearchBlurTimer=setTimeout(function(){if(!input.value){var wrap=document.getElementById('nav-search');if(wrap)wrap.classList.remove('open');}},200);
  }
  document.addEventListener('click',function(e){
    var btn=document.getElementById('nav-hamburger');
    var menu=document.getElementById('nav-mobile-menu');
    if(btn&&menu&&!btn.contains(e.target)&&!menu.contains(e.target)){btn.classList.remove('open');menu.classList.remove('open');}
  });
</script>
<script>
  // TABLE OF CONTENTS — scroll tracking
  (function(){
    var tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks.length) return;
    var headingIds = [];
    tocLinks.forEach(function(l){ headingIds.push(l.getAttribute('href').slice(1)); });
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          tocLinks.forEach(function(l){ l.classList.remove('active'); });
          var active = document.querySelector('.toc-link[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-100px 0px -66% 0px', threshold: 0 });
    headingIds.forEach(function(id){
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    // Fade in
    var sticky = document.querySelector('.toc-sticky');
    if (sticky) setTimeout(function(){ sticky.classList.add('visible'); }, 100);
    // Smooth scroll on click
    tocLinks.forEach(function(link){
      link.addEventListener('click', function(e){
        e.preventDefault();
        var target = document.getElementById(this.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  })();
</script>
<script>
  function toggleTheme(){
    var html=document.documentElement;
    var next=html.getAttribute('data-theme')==='dark'?'light':'dark';
    html.setAttribute('data-theme',next);
    localStorage.setItem('theme',next);
  }
</script>

<div class="cookie-banner" id="cookie-banner">
  <div class="cookie-banner__inner">
    <p class="cookie-banner__text">
      We use cookies to analyse traffic and improve your experience.
      <a href="/privacy-policy.html">Privacy Policy</a>
    </p>
    <div class="cookie-banner__actions">
      <button class="cookie-banner__decline" onclick="cookieDecline()">Decline</button>
      <button class="cookie-banner__accept" onclick="cookieAccept()">Accept</button>
    </div>
  </div>
</div>
<script>
function cookieAccept() {
  localStorage.setItem('cookie_consent', 'accepted');
  document.getElementById('cookie-banner').classList.remove('visible');
  loadAnalytics();
  loadAdSense();
}
function cookieDecline() {
  localStorage.setItem('cookie_consent', 'declined');
  document.getElementById('cookie-banner').classList.remove('visible');
  loadAdSenseNonPersonalised();
}
function loadAnalytics() {
  const s = document.createElement('script');
  s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
  s.async = true;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
}
function loadAdSense() {
  const s = document.createElement('script');
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}';
  s.async = true;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}
function loadAdSenseNonPersonalised() {
  const s = document.createElement('script');
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}';
  s.async = true;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
  window.adsbygoogle = window.adsbygoogle || [];
  (adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
}
(function() {
  const consent = localStorage.getItem('cookie_consent');
  if (consent === 'accepted') {
    loadAnalytics();
    loadAdSense();
  } else if (consent === 'declined') {
    loadAdSenseNonPersonalised();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      const banner = document.getElementById('cookie-banner');
      if (banner) banner.classList.add('visible');
    });
  }
})();
</script>

</body>
</html>`;

  fs.writeFileSync(path.join(publishedDir, slug + '.html'), articlePage);
  console.log('  Built: ' + slug + '.html');
}

articles.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(path.join(__dirname, '../content/articles.json'), JSON.stringify(articles, null, 2));

// Generate sitemap
// Normalise any incoming date-ish value (string, Date, empty) to strict YYYY-MM-DD.
// Returns null when the value can't be parsed into a real date — callers then omit <lastmod>.
const toISODate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  if (!str) return null;
  // Fast path: already strict YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};
const today = new Date().toISOString().split('T')[0];
const sitemapEntries = articles.map(a => {
  const lastmod = toISODate(a.date_modified) || toISODate(a.date);
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${SITE_URL}/content/published/${a.slug}</loc>${lastmodTag}
    <priority>0.8</priority>
  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/articles.html</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about.html</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact.html</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy-policy.html</loc>
    <priority>0.4</priority>
  </url>
${sitemapEntries}
</urlset>`;

fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), sitemap);
console.log('Sitemap generated with ' + articles.length + ' article(s).');

// Inject LCP preload for featured (newest) article image into index.html
if (articles.length > 0 && articles[0].image) {
  const featImg = articles[0].image;
  // articles[0].image already has /static/images/articles/ prefix
  const featBase = featImg.replace(/\.[^/.]+$/, '');
  const preloadTag = `<link rel="preload" as="image" type="image/webp" fetchpriority="high" imagesrcset="${featBase}-400w.webp 400w, ${featBase}-800w.webp 800w, ${featBase}.webp 1600w" imagesizes="(max-width: 768px) 400px, (max-width: 1200px) 800px, 800px">`;
  const indexPath = path.join(__dirname, '../index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  // Remove any previously injected preload
  indexHtml = indexHtml.replace(/\n  <!-- LCP preload -->\n  <link rel="preload" as="image"[^>]*>/g, '');
  // Inject after canonical
  indexHtml = indexHtml.replace(
    '<link rel="canonical" href="https://talentedatai.com/" />',
    '<link rel="canonical" href="https://talentedatai.com/" />\n  <!-- LCP preload -->\n  ' + preloadTag
  );
  fs.writeFileSync(indexPath, indexHtml);
  console.log('Injected LCP preload for: ' + featImg);
}

// --- IndexNow: write key file + ping API ---
async function pingIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY || '387e8459eb7f485c930b1d36cac02ee4';
  const keyFile = key + '.txt';

  // Write key verification file
  fs.writeFileSync(path.join(__dirname, '..', keyFile), key);
  console.log('IndexNow key file written: ' + keyFile);

  // Collect URLs: homepage + articles page + all article URLs
  const allUrls = [
    'https://talentedatai.com',
    'https://talentedatai.com/articles.html',
    ...urls
  ];

  try {
    const fetchFn = typeof fetch === 'function' ? fetch : (...args) => import('node-fetch').then(({default: f}) => f(...args));
    const response = await fetchFn('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'talentedatai.com',
        key: key,
        keyLocation: 'https://talentedatai.com/' + keyFile,
        urlList: allUrls
      })
    });
    console.log('IndexNow pinged: ' + response.status + ' (' + allUrls.length + ' URLs)');
  } catch (err) {
    console.warn('IndexNow ping failed (non-fatal): ' + err.message);
  }
}

const articleUrls = articles.map(a => SITE_URL + '/content/published/' + a.slug);
await pingIndexNow(articleUrls);

console.log('\nBuild complete. ' + mdFiles.length + ' article(s) built.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
})().catch(error => {
  console.error('Unhandled build error:', error);
  process.exit(1);
});
