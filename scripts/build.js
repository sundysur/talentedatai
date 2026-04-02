const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const publishedDir = './content/published';

if (!fs.existsSync(publishedDir)) {
  console.log('No published articles yet.');
  process.exit(0);
}

const mdFiles = fs.readdirSync(publishedDir).filter(f => f.endsWith('.md'));
console.log('Building ' + mdFiles.length + ' article(s)...');

const articles = [];

mdFiles.forEach(file => {
  const raw = fs.readFileSync(path.join(publishedDir, file), 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data;
  const content = parsed.content;
  const html = marked.parse(content);
  const slug = file.replace('.md', '');

  articles.push({
    slug,
    title: fm.title || slug,
    description: fm.description || '',
    category: fm.category || 'General',
    date: fm.date || '',
    author: fm.author || 'TalentedAtAI Team',
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
  <title>${fm.title || slug} | TalentedAtAI</title>
  <link rel="canonical" href="https://talentedatai.com/content/published/${slug}.html">
  <meta name="description" content="${fm.description}">
  <meta property="og:title" content="${fm.title} — TalentedAtAI">
  <meta property="og:description" content="${fm.description}">
  <meta property="og:url" content="https://talentedatai.com/content/published/${slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://talentedatai.com/static/images/articles/${fm.image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fm.title} — TalentedAtAI">
  <meta name="twitter:description" content="${fm.description}">
  <meta name="twitter:image" content="https://talentedatai.com/static/images/articles/${fm.image}">
  <meta name="author" content="${fm.author || 'TalentedAtAI Team'}"/>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${fm.title}",
    "description": "${fm.description}",
    "image": "https://talentedatai.com/static/images/articles/${fm.image}",
    "datePublished": "${fm.date}",
    "dateModified": "${fm.date}",
    "author": {
      "@type": "Organization",
      "name": "TalentedAtAI",
      "url": "https://talentedatai.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TalentedAtAI",
      "url": "https://talentedatai.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://talentedatai.com/static/images/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://talentedatai.com/content/published/${slug}.html"
    }
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
        "item": "https://talentedatai.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Articles",
        "item": "https://talentedatai.com/articles.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${fm.title}",
        "item": "https://talentedatai.com/content/published/${slug}.html"
      }
    ]
  }
  </script>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SYQ40F2CXQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SYQ40F2CXQ');
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet"/>
  <style>
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
    body{font-family:'DM Sans',sans-serif;color:var(--text);background:var(--white);line-height:1.7;-webkit-font-smoothing:antialiased}
    a{color:var(--blue);text-decoration:none}
    a:hover{text-decoration:underline}
    nav{position:sticky;top:0;background:rgba(250,250,248,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray-200);padding:0 48px;height:64px;display:flex;align-items:center;justify-content:space-between;z-index:100}
    .nav-logo{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--dark);text-decoration:none}
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
    .article-hero h1{font-family:'Syne',sans-serif;font-size:clamp(30px,5vw,48px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:20px;color:var(--dark)}
    .article-desc{font-size:18px;color:var(--gray-600);line-height:1.65;font-weight:300;padding-bottom:40px;border-bottom:1px solid var(--gray-200)}
    .article-body{max-width:760px;margin:0 auto;padding:48px 24px 96px}
    .article-body h2{font-family:'Syne',sans-serif;font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.2;margin:56px 0 16px;color:var(--dark)}
    .article-body h3{font-family:'Syne',sans-serif;font-size:21px;font-weight:700;margin:40px 0 12px;color:var(--dark)}
    .article-body h4{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin:28px 0 8px;color:var(--dark)}
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
    .article-body th{font-family:'Syne',sans-serif;font-weight:700;text-align:left;padding:12px 16px;background:var(--gray-100);border-bottom:2px solid var(--gray-200)}
    .article-body td{padding:12px 16px;border-bottom:1px solid var(--gray-200);color:#2a2a28}
    .article-body tr:last-child td{border-bottom:none}
    footer{background:var(--dark);color:rgba(255,255,255,.45);text-align:center;padding:40px 24px;font-size:13px}
    footer a{color:var(--blue)}
    .footer-logo{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:white;margin-bottom:8px}
    .footer-logo span{color:var(--blue)}
    @media(max-width:640px){nav{padding:0 20px}.article-hero{padding:40px 20px 32px}.article-body{padding:32px 20px 64px}}
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
  <a href="https://talentedatai.com" class="nav-logo">Talented<span>At</span>AI</a>
  <ul class="nav-links">
    <li><a href="https://talentedatai.com" class="nav-back">← All articles</a></li>
    <li><a href="https://talentedatai.com/about.html">About</a></li>
    <li><a href="https://talentedatai.com/contact.html">Contact</a></li>
  </ul>
</nav>
<div class="article-hero">
  <span class="category-pill">${fm.category || 'General'}</span>
  <div class="article-meta">
    <span>${fm.author || 'TalentedAtAI Team'}</span>
    <span>·</span>
    <span>${fm.date || ''}</span>
    <span>·</span>
    <span>${readTime}</span>
  </div>
  <h1>${fm.title || ''}</h1>
  <p style="color:#5a5a55;font-size:0.9em;margin:4px 0 24px 0;">
    Last updated: ${new Date(fm.date).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})}
  </p>
  <p class="article-desc">${fm.description || ''}</p>
${fm.image ? `
<div style="margin-top:32px;border-radius:16px;overflow:hidden;max-height:420px;">
  <img
    src="/static/images/articles/${fm.image}"
    alt="${fm.title || ''}"
    loading="lazy"
    style="width:100%;height:420px;object-fit:cover;display:block;"
  />
</div>` : ''}
</div>
<div class="article-body">
${html}
</div>
<div style="max-width:760px;margin:0 auto;padding:0 24px 48px;">
  <div style="border-top:1px solid #e8e8e5;margin-top:48px;padding-top:24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
    <span style="font-family:'DM Sans',sans-serif;color:#5a5a55;font-size:15px;">Found this useful?</span>
    <a href="https://x.com/intent/tweet?text=${encodeURIComponent(fm.title + ' — via @talentedat\nhttps://talentedatai.com/content/published/' + slug + '.html')}"
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
  <p style="margin-top:8px">&copy; 2026 TalentedAtAI. All rights reserved. &nbsp;·&nbsp; <a href="https://talentedatai.com">Home</a> &nbsp;·&nbsp; <a href="https://talentedatai.com/about.html">About</a> &nbsp;·&nbsp; <a href="https://talentedatai.com/privacy-policy.html">Privacy</a></p>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(publishedDir, slug + '.html'), articlePage);
  console.log('  Built: ' + slug + '.html');
});

articles.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync('./content/articles.json', JSON.stringify(articles, null, 2));
console.log('\nBuild complete. ' + mdFiles.length + ' article(s) built.');
