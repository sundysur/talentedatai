# TalentedAtAI Content Dashboard

The dashboard at `dashboard/index.html` is a standalone single-page app that connects directly to the GitHub API to list, approve, and reject articles — no backend or server required.

---

## How to Generate a GitHub Personal Access Token

You need a **Personal Access Token (classic)** with `repo` scope.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
   Direct URL: https://github.com/settings/tokens

2. Click **"Generate new token (classic)"**

3. Give it a descriptive name, e.g. `TalentedAtAI Dashboard`

4. Set **Expiration** — choose 90 days or "No expiration" for convenience

5. Under **Select scopes**, check `repo` (this grants read and write access to repository contents)

6. Click **"Generate token"**

7. **Copy the token immediately** — GitHub only shows it once. It starts with `ghp_`.

> **Scope note:** The dashboard only needs to read and write files in `content/`. If you want to use a fine-grained token instead of classic, grant it read/write access to **Contents** for the `talentedatai` repository.

---

## How to Log Into the Dashboard

1. Open `dashboard/index.html` in your browser (or navigate to `https://talentedatai.com/dashboard/`)

2. You'll see the **"Connect to GitHub"** login screen

3. Paste your token into the input field

4. Click **Connect →**

The dashboard verifies the token by fetching the repository metadata. If the token is valid and has `repo` scope, you'll be taken directly to the Pending Review tab.

**Your token is stored in `localStorage`** under the key `gh_token`. It persists across page refreshes and browser restarts until you click "Disconnect token" or clear your browser data.

To log out, click **"⏻ Disconnect token"** in the bottom-left of the sidebar. This clears the token from localStorage immediately.

---

## How the Approve / Reject Flow Works

### Approve

When you click **✓ Approve** on a pending article:

1. The dashboard fetches the file from `content/pending/{filename}.md` via the GitHub API to get its current SHA and base64-encoded content
2. It creates the same file at `content/published/{filename}.md` with the commit message `publish: {title}`
3. It deletes `content/pending/{filename}.md` with the commit message `remove from pending: {title}`
4. GitHub Actions detects the push to `content/published/` and automatically:
   - Runs `node scripts/build.js` to convert the markdown to a styled HTML article page
   - Deploys the updated site to GitHub Pages
5. The article card disappears from Pending and appears in the Published tab

### Reject

When you click **✗ Reject** on a pending article:

1. A confirmation dialog appears — you must confirm before the action proceeds
2. The same 3-step flow runs, moving the file from `content/pending/` to `content/rejected/`
3. Commit message: `reject: {title}`
4. The article appears in the Rejected tab, where it can be re-approved later

### Other Actions

| Action | From | To | Trigger |
|--------|------|----|---------|
| Approve | Pending | Published | ✓ Approve button |
| Reject | Pending | Rejected | ✗ Reject button (requires confirm) |
| Unpublish | Published | Pending | ↩ Unpublish button (requires confirm) |
| Re-approve | Rejected | Published | ✓ Re-approve button |

All actions make real GitHub API calls and create real git commits in the repository.

---

## Rate Limits

The GitHub API allows **5,000 requests per hour** when authenticated with a Personal Access Token. Each dashboard load makes approximately:
- 3 API calls to list the three folders (pending, published, rejected)
- N calls to fetch individual file content (one per article per tab)

For a site with ~10 articles across all tabs, a typical session uses fewer than 30 API calls — well within limits.

If you hit the rate limit, the dashboard shows a clear error message: `"GitHub rate limit exceeded. Resets at HH:MM:SS."` Wait until the reset time and refresh.

---

## Security Note — Token in localStorage

Your GitHub token is stored in your browser's `localStorage`. This is the standard approach for browser-based GitHub tools (including GitHub's own web editor), but you should be aware of the implications:

- **The token is accessible to any JavaScript running on the same origin.** Only use this dashboard on a domain you control and trust.
- **Do not use this dashboard on a shared or public computer.** Always click "Disconnect token" before leaving.
- **The token is NOT sent to any third party.** All API calls go directly to `api.github.com` — you can verify this in your browser's Network tab.
- **Set an expiration on your token.** If the token expires or is revoked, the dashboard will prompt you to reconnect.
- **Use the minimum necessary scope.** A `repo`-scoped classic token works, but a fine-grained token restricted to the `talentedatai` repository's Contents (read/write) is more secure.

If you suspect your token has been compromised, revoke it immediately at https://github.com/settings/tokens and generate a new one.

---

## Troubleshooting

**"Token invalid or expired"** — The token has been revoked or expired. Generate a new one at https://github.com/settings/tokens.

**"403 Forbidden / Check token permissions"** — The token doesn't have `repo` scope. Regenerate with the correct scope.

**"Rate limit exceeded"** — Wait for the displayed reset time, then refresh.

**Article shows as blank / missing fields** — The markdown file's front matter may be malformed. Open the `.md` file directly and verify the `---` delimiters are correct and the YAML is valid.

**Action succeeds but site doesn't update** — Check the GitHub Actions tab in your repository for build errors. The build runs automatically after every push to `content/published/`.
