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
  const html = marked.parse(content);
  const slug = file.replace('.md', '');

  articles.push({
    slug,
    title: fm.title || slug,
    description: fm.description || '',
    category: fm.category || 'General',
    filters: fm.filters || [],
    date: fm.date || '',
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
  <link rel="canonical" href="${SITE_URL}/content/published/${slug}.html">
  ${fm.image ? `<link rel="preload" as="image" type="image/webp" imagesrcset="/static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-400w.webp 400w, /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}-800w.webp 800w, /static/images/articles/${fm.image.replace(/\.[^/.]+$/, '')}.webp 1600w" imagesizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1600px">` : ''}
  <meta name="description" content="${fm.description}">
  <meta property="og:title" content="${fm.title} — ${SITE_NAME}">
  <meta property="og:description" content="${fm.description}">
  <meta property="og:url" content="${SITE_URL}/content/published/${slug}.html">
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
      "@id": "${SITE_URL}/content/published/${slug}.html"
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
        "item": "${SITE_URL}/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Articles",
        "item": "${SITE_URL}/articles.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${(fm.title || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
        "item": "${SITE_URL}/content/published/${slug}.html"
      }
    ]
  }
  </script>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  </script>
  <style>
    @font-face{font-family:'DM Sans';font-style:normal;font-weight:300 600;font-display:optional;src:url(/static/fonts/dm-sans-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'DM Sans';font-style:italic;font-weight:400;font-display:optional;src:url(/static/fonts/dm-sans-italic-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'Syne';font-style:normal;font-weight:400 800;font-display:optional;src:url(/static/fonts/syne-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:'Syne Fallback';src:local('Arial Black'),local('Arial');size-adjust:97%;ascent-override:105%;descent-override:30%;line-gap-override:0%}
    @font-face{font-family:'DM Sans Fallback';src:local('Arial'),local('Helvetica');size-adjust:105%;ascent-override:95%;descent-override:25%;line-gap-override:0%}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --blue:#0066ff;
      --blue-light:#e8f0ff;
      --dark:#0a0a0a;
      --text:#1a1a18;
      --gray-400:#9a9a95;
      --gray-600:#5a5a55;
      --gray-100:#f5f5f3;
      --gray-200:#e8e8e5;
      --white:#fafaf8;
    }
    body{font-family:'DM Sans','DM Sans Fallback',sans-serif;color:var(--text);background:var(--white);line-height:1.7;-webkit-font-smoothing:antialiased}
    a{color:var(--blue);text-decoration:none}
    a:hover{text-decoration:underline}
    nav{position:sticky;top:0;background:rgba(250,250,248,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray-200);padding:0 48px;height:64px;display:flex;align-items:center;justify-content:space-between;z-index:100}
    .nav-logo{font-family:'Syne','Syne Fallback',sans-serif;font-size:18px;font-weight:800;color:var(--dark);text-decoration:none}
    .nav-logo span{color:var(--blue)}
    .nav-back{font-size:13px;color:var(--gray-600);text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .2s}
    .nav-back:hover{color:var(--blue);text-decoration:none}
    .nav-links{display:flex;gap:32px;list-style:none;align-items:center}
    .nav-links a{font-size:13px;font-weight:500;color:var(--gray-600);text-decoration:none;transition:color .2s}
    .nav-links a:hover{color:var(--dark)}
    @media(max-width:640px){.nav-links{display:none}}
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
    .article-body table{width:100%;border-collapse:collapse;margin:28px 0;font-size:15px}
    .article-body th{font-family:'Syne','Syne Fallback',sans-serif;font-weight:700;text-align:left;padding:12px 16px;background:var(--gray-100);border-bottom:2px solid var(--gray-200)}
    .article-body td{padding:12px 16px;border-bottom:1px solid var(--gray-200);color:#2a2a28}
    .article-body tr:last-child td{border-bottom:none}
    footer{background:var(--dark);color:rgba(255,255,255,.45);text-align:center;padding:40px 24px;font-size:13px}
    footer a{color:var(--blue)}
    .footer-logo{font-family:'Syne','Syne Fallback',sans-serif;font-size:16px;font-weight:800;color:white;margin-bottom:8px}
    .footer-logo span{color:var(--blue)}
    @media(max-width:640px){nav{padding:0 20px}.article-hero{padding:40px 20px 32px}.article-body{padding:32px 20px 64px}}
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
<nav>
  <a href="${SITE_URL}" class="nav-logo">Talented<span>At</span>AI</a>
  <ul class="nav-links">
    <li><a href="${SITE_URL}" class="nav-back">← All articles</a></li>
    <li><a href="${SITE_URL}/about.html">About</a></li>
    <li><a href="${SITE_URL}/contact.html">Contact</a></li>
  </ul>
</nav>
<div class="article-hero">
  <span class="category-pill">${fm.category || 'General'}</span>
  <div class="article-meta">
    <span>${fm.author || DEFAULT_AUTHOR}</span>
    <span>·</span>
    <span>${fm.date || ''}</span>
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
<div class="article-body">
${html}
</div>
<div style="max-width:760px;margin:0 auto;padding:0 24px 48px;">
  <div style="border-top:1px solid #e8e8e5;margin-top:48px;padding-top:24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
    <span style="font-family:'DM Sans',sans-serif;color:#5a5a55;font-size:15px;">Found this useful?</span>
    <a href="https://x.com/intent/tweet?text=${encodeURIComponent(fm.title + ' — via @talentedat\n' + SITE_URL + '/content/published/' + slug + '.html')}"
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
<footer>
  <div class="footer-logo">Talented<span>At</span>AI</div>
  <p style="margin-top:8px">&copy; 2026 ${SITE_NAME}. All rights reserved. &nbsp;·&nbsp; <a href="${SITE_URL}">Home</a> &nbsp;·&nbsp; <a href="${SITE_URL}/about.html">About</a> &nbsp;·&nbsp; <a href="${SITE_URL}/privacy-policy.html">Privacy</a></p>
</footer>
<script>
  window.addEventListener('load', function() {
    var s = document.createElement('script');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}';
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.body.appendChild(s);
  });
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(publishedDir, slug + '.html'), articlePage);
  console.log('  Built: ' + slug + '.html');
}

articles.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(path.join(__dirname, '../content/articles.json'), JSON.stringify(articles, null, 2));

// Generate sitemap
const today = new Date().toISOString().split('T')[0];
const sitemapEntries = articles.map(a => `  <url>
    <loc>${SITE_URL}/content/published/${a.slug}.html</loc>
    <lastmod>${a.date}</lastmod>
    <priority>0.8</priority>
  </url>`).join('\n');

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

console.log('\nBuild complete. ' + mdFiles.length + ' article(s) built.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
})().catch(error => {
  console.error('Unhandled build error:', error);
  process.exit(1);
});
