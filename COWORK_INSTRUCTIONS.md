# TalentedAtAI — Cowork Instructions

Complete guide for managing your TalentedAtAI content site.

---

## Project Structure

```
talentedatai/
├── index.html                        ← Main homepage
├── COWORK_INSTRUCTIONS.md            ← This file
├── content/
│   ├── pending/                      ← New articles waiting for approval
│   │   └── *.md                      ← Markdown article files
│   ├── published/                    ← Approved & live articles
│   │   ├── *.md                      ← Source markdown
│   │   └── *.html                    ← Built HTML pages (auto-generated)
│   └── articles.json                 ← Article index (auto-generated on build)
├── dashboard/
│   └── index.html                    ← Content approval dashboard
├── assets/
│   └── (images, icons, etc.)
└── .github/
    └── workflows/
        └── deploy.yml                ← Auto-deploy on publish
```

---

## How to Write a New Article

### Step 1: Create a markdown file in `content/pending/`

Name the file using a URL-friendly slug. Use lowercase letters, numbers, and hyphens only.

**Good:** `best-ai-tools-for-students-2026.md`
**Bad:** `Best AI Tools For Students 2026.md`

### Step 2: Add the required front matter

Every article must start with YAML front matter between triple-dashes:

```markdown
---
title: "Your Article Title Here"
description: "A 1–2 sentence summary for SEO and social sharing. Aim for 150–160 characters."
category: "Productivity"
tags: ["tag one", "tag two", "tag three", "tag four"]
date: "2026-03-29"
author: "Your Name"
author_bio: "One sentence about the author."
slug: "your-article-slug"
featured: false
status: "pending"
read_time: "5 min"
image_alt: "Description of the article's hero image"
---

Your article content starts here...
```

### Step 3: Write your article in Markdown

Use standard Markdown formatting:

```markdown
## H2 Section Heading

Regular paragraph text. Use **bold** and *italic* sparingly.

### H3 Subsection

- Bullet point one
- Bullet point two

1. Numbered item
2. Another numbered item

> Blockquote for important callouts

| Column 1 | Column 2 |
|----------|----------|
| Data     | Data     |

`inline code` or code blocks:

```python
print("Hello world")
```
```

---

## Valid Categories

Use exactly one of these categories in your front matter:

| Category | Use for |
|----------|---------|
| `Productivity` | Tools and workflows for getting more done |
| `AI Writing` | Writing tools, prompts, content creation |
| `Coding & Dev` | Developer tools, coding with AI |
| `Business & Marketing` | AI for business, marketing, sales |
| `Design & Creative` | Image gen, design tools, creative AI |
| `Research & Analysis` | Research tools, data analysis with AI |
| `Learning & Education` | AI for learning, courses, skills |
| `Comparison` | Head-to-head AI tool comparisons |

---

## The Approval Workflow

### Step 1: Article lands in `content/pending/`

All new articles start here. They are **not live** on the site yet.

### Step 2: Open the Dashboard

Open `dashboard/index.html` in your browser. You'll see all pending articles with:
- Title, author, date, read time
- Category badge and status
- Preview, Approve, and Reject buttons

### Step 3: Preview an article

Click **Preview** to read the full article content, description, and metadata before making a decision.

### Step 4: Approve or Reject

**To Approve:** Click the green **Approve** button. In the dashboard this marks it as published (the status updates live).

**In production with Git:** Approving means moving the file from `pending/` to `published/`:

```bash
# On your computer in the talentedatai/ folder:
mv content/pending/article-slug.md content/published/article-slug.md
git add .
git commit -m "publish: article-slug"
git push origin main
```

GitHub Actions will automatically:
1. Build the HTML article page from the markdown
2. Update `content/articles.json`
3. Deploy the site to GitHub Pages

**To Reject:** Click the red **Reject** button. The article stays in `pending/` (or is moved to an `archived/` folder if you prefer).

### Step 5: Verify the live site

After GitHub Actions completes (usually 2–3 minutes), check your site at:
`https://[your-github-username].github.io/talentedatai/`
or your custom domain `https://talentedatai.com`

---

## How the Build System Works

When you push a change to `content/published/`, GitHub Actions runs automatically:

1. Checks out your repository
2. Installs `marked` and `gray-matter` (Node.js packages)
3. Reads every `.md` file in `content/published/`
4. Builds a full HTML article page for each, using the front matter for SEO
5. Generates `content/articles.json` (an index of all articles)
6. Deploys everything to GitHub Pages

**The build file is:** `.github/workflows/deploy.yml`

You can also trigger a build manually from GitHub → Actions → "Build & Deploy TalentedAtAI" → "Run workflow".

---

## Setting Up GitHub Pages (One-Time Setup)

1. Push your `talentedatai/` folder to a GitHub repository named `talentedatai`
2. Go to **Settings → Pages** in your GitHub repo
3. Set **Source** to "GitHub Actions"
4. Push any change to trigger the first deployment
5. Your site will be live at `https://[username].github.io/talentedatai/`

**To connect a custom domain (talentedatai.com):**
1. In GitHub → Settings → Pages → Custom domain, enter `talentedatai.com`
2. In your domain registrar, add a CNAME record: `www` → `[username].github.io`
3. Add A records pointing to GitHub Pages IPs (listed in GitHub docs)

---

## Adding Articles with Cowork (Recommended)

You can ask Cowork (this assistant) to:

- **Write a new article** for you on any AI topic
- **Optimize an existing article** for SEO
- **Update the homepage** to feature new articles
- **Add a new category** to the categories section
- **Update stats** in the hero section

**Example prompts to use with Cowork:**

> "Write a new article about the best AI tools for video editing in 2026. Save it to content/pending/ with proper SEO front matter."

> "Update the homepage hero stats and add the 3 pending articles to the article grid."

> "Approve the article 'best-ai-writing-tools-bloggers' and update the homepage to feature it."

> "Write a comparison article: Notion AI vs Obsidian with AI plugins."

---

## Article Quality Checklist

Before approving any article, verify:

- [ ] Front matter is complete (title, description, category, tags, date, author, slug)
- [ ] Title is compelling and includes the target keyword
- [ ] Description is 150–160 characters
- [ ] Article has a clear introduction that hooks the reader
- [ ] H2 headings divide content into logical sections
- [ ] At least one comparison table or structured data element
- [ ] Includes a clear recommendation or conclusion
- [ ] No factual errors (verify stats and claims)
- [ ] Read time estimate is accurate (~200 words per minute)
- [ ] No broken markdown syntax

---

## SEO Best Practices

**Title:** Include the primary keyword, aim for 50–60 characters
**Description:** Include keyword, benefit statement, 150–160 characters
**Slug:** Short, keyword-rich, hyphens only
**H2 headings:** Use secondary keywords naturally
**Internal links:** Link to other TalentedAtAI articles when relevant
**Tags:** 4–6 specific, relevant tags per article

---

## File Naming Convention

| Type | Convention | Example |
|------|-----------|---------|
| Article slug | `topic-keyword-year.md` | `best-ai-tools-2026.md` |
| Comparison | `tool-a-vs-tool-b-year.md` | `chatgpt-vs-claude-2026.md` |
| Listicle | `number-things-about-topic.md` | `10-ai-prompts-for-writers.md` |
| Guide | `how-to-do-thing-with-ai.md` | `how-to-use-ai-for-research.md` |

---

## Common Commands

```bash
# View your local site (if running a local server)
cd ~/talentedatai && python3 -m http.server 8080
# Then open: http://localhost:8080

# Move an article from pending to published
mv content/pending/article-name.md content/published/article-name.md

# Deploy to GitHub
git add .
git commit -m "publish: article-name"
git push origin main

# Check GitHub Actions status
# Go to: https://github.com/[username]/talentedatai/actions
```

---

## Troubleshooting

**Articles not showing in dashboard?**
The dashboard reads from JavaScript data. If you've added articles manually, open `dashboard/index.html` and add them to the `articles` array in the `<script>` section (until a backend API is connected).

**GitHub Actions failing?**
Check the Actions tab in your GitHub repo for error logs. The most common issue is missing Node.js packages — the workflow installs them automatically, but double-check the deploy.yml if errors persist.

**Site not updating after push?**
GitHub Pages deployments take 1–3 minutes. Check the Actions tab for deployment status.

**Custom domain not working?**
DNS changes can take up to 48 hours to propagate. Verify your CNAME record is set correctly.

---

## Adding Images to Articles

Article pages and homepage cards both support hero images. Images are stored locally and referenced by filename in the article's front matter.

### Where to put images

Drop images into:
```
~/talentedatai/static/images/articles/
```

### Supported formats

`jpg`, `jpeg`, `png`, `webp` — **webp is preferred** for smaller file sizes and faster load times.

### Recommended dimensions

| Use | Dimensions | Minimum |
|-----|-----------|---------|
| Article hero image | 1200×630px | — |
| Homepage card thumbnail | 1200×630px | 800×450px |

Both the article hero and the homepage card use the same image file, so aim for 1200×630px to cover both.

### How to reference in front matter

Add the `image` field to your article's YAML front matter:

```yaml
---
title: "Your Article Title"
description: "..."
category: "Productivity"
date: "2026-04-01"
author: "TalentedAtAI Team"
image: "your-image-filename.webp"
slug: "your-article-slug"
read_time: "6 min"
---
```

The filename must match exactly (case-sensitive) what you've placed in `static/images/articles/`.

If `image` is empty or omitted, the card and article page fall back to the coloured gradient background with emoji — no errors, no broken images.

### Free image sources

- **[unsplash.com](https://unsplash.com)** — High-quality photos, free to use
- **[pexels.com](https://pexels.com)** — Free stock photos and videos

Download the image, rename it clearly (e.g. `ai-productivity-tools-2026.webp`), and drop it into `static/images/articles/`.

### Full workflow for adding an image to an article

1. Find an image on unsplash.com or pexels.com
2. Download and rename it clearly, e.g. `ai-agents-header.webp`
3. Move it into `~/talentedatai/static/images/articles/`
4. Open the article's `.md` file in `content/published/` and add or update the `image` field:
   ```yaml
   image: "ai-agents-header.webp"
   ```
5. Commit and push:
   ```bash
   cd ~/talentedatai
   git add .
   git commit -m "add article image"
   git push
   ```
6. GitHub Actions will rebuild the article page and update `articles.json` — the image appears on both the article page and the homepage card automatically within 2–3 minutes.

---

## Contact & Feedback

Site: [talentedatai.com](https://talentedatai.com)
Built with: GitHub Pages + GitHub Actions + Vanilla HTML/CSS
Content managed with: Cowork by Anthropic

---

*Last updated: March 2026*
