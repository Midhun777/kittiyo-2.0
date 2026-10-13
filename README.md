# LabDrop

**Move words. Not apps.**

LabDrop lets you transfer text or a URL from one device to another using a temporary 6-digit code. No accounts, no apps to install, no sign-in required.

Built for college computer labs where students need to quickly move a link or snippet from their phone to a shared PC.

---

## How it works

1. **Send**: Open LabDrop on your phone → paste text or a URL → get a 6-digit code
2. **Receive**: Open LabDrop on the lab PC → enter the code → view the content

Shares expire after **10 minutes**. No data is stored permanently.

---

## Tech stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React, Vite, Tailwind CSS v4      |
| Backend  | Node.js, Express (local dev)      |
| API      | Vercel Serverless Functions        |
| Database | MongoDB Atlas (Free tier)          |
| Hosting  | Vercel                             |

---

## Project structure

```
labdrop/
├── api/                    # Vercel serverless API routes
│   ├── health.js           # GET /api/health
│   └── shares/
│       ├── index.js        # POST /api/shares (create)
│       └── retrieve.js     # POST /api/shares/retrieve
├── lib/                    # Shared backend utilities
│   ├── db.js               # MongoDB connection (cached)
│   ├── rateLimit.js        # MongoDB-based rate limiting
│   └── share.js            # Code generation, validation, hashing
├── src/                    # React frontend
│   ├── main.jsx            # Entry point
│   ├── App.jsx             # Router setup
│   ├── index.css           # Tailwind + design tokens
│   ├── components/
│   │   ├── HomePage.jsx    # Landing: Send / Receive
│   │   ├── SendPage.jsx    # Text input + generate code
│   │   ├── CodePage.jsx    # Display code + countdown
│   │   ├── ReceivePage.jsx # 6-digit code entry
│   │   └── ContentPage.jsx # Display shared content
│   └── utils/
│       └── api.js          # Frontend API client
├── scripts/
│   └── setup-db.js         # One-time database index setup
├── tests/
│   └── share.test.js       # Unit tests (vitest)
├── server.dev.js           # Local Express dev server
├── vite.config.mjs         # Vite configuration
├── vercel.json             # Vercel routing + security headers
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

## Getting started

### Prerequisites

- **Node.js** 18+ and npm
- A **MongoDB Atlas** account (free tier works)
- A **Vercel** account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/labdrop.git
cd labdrop
npm install
```

### 2. Set up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **Free Shared Cluster** (M0).
3. In **Database Access**, create a database user with a strong password. Grant **Read and Write to any database**.
4. In **Network Access**:
   - For **local development**: add your current IP address.
   - For **Vercel deployment**: add `0.0.0.0/0` (allow from anywhere). This is necessary because Vercel's serverless functions use dynamic IPs. The database user credentials provide the access control.
5. Click **Connect → Drivers** and copy the connection string.

> **⚠️ Note:** Allowing all IPs (`0.0.0.0/0`) means anyone with the database credentials can connect. Use a strong password and don't share it. For higher-security deployments, consider Vercel's static IP add-on or MongoDB Atlas private endpoints (paid features).

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
MONGODB_URI=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=labdrop
APP_ORIGIN=http://localhost:5173
```

### 4. Set up the database

```bash
npm run setup-db
```

This creates the required indexes:
- `shares.expiresAt` — TTL index for automatic cleanup
- `shares.codeHash` — fast code lookup
- `rateLimits.expiresAt` — TTL cleanup for rate limit entries
- `rateLimits.key` — unique index for atomic rate limit updates

### 5. Run locally

Open **two terminals**:

```bash
# Terminal 1: API server (port 3001)
npm run dev:api

# Terminal 2: Frontend dev server (port 5173)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Testing

### Automated tests

```bash
npm test
```

Runs 27 unit tests covering:
- Code generation (format, leading zeroes, randomness)
- SHA-256 hashing (consistency, no leakage)
- Content type detection (HTTP/HTTPS URLs vs text)
- URL safety validation (rejects javascript:, data:, file: schemes)
- Content validation (empty, null, undefined, non-string, too long, max length)
- Code format validation (6-digit, non-digit rejection, wrong length)
- Security checks (hash output doesn't contain input code)

### Manual test checklist

Test the full phone-to-PC flow:

- [ ] Open LabDrop on your **phone**
- [ ] Tap "Send something"
- [ ] Paste some text → tap "Generate code" → note the 6-digit code
- [ ] Verify the countdown timer starts at ~10:00
- [ ] Open LabDrop on a **different device** (laptop, lab PC)
- [ ] Tap "Receive with a code"
- [ ] Enter the 6-digit code → tap "Open share"
- [ ] Verify the text appears correctly
- [ ] Tap "Copy" → paste somewhere to verify clipboard works
- [ ] Repeat with a URL (e.g., `https://example.com`)
- [ ] Verify "Open link" button appears for URLs
- [ ] Verify the link opens in a new tab
- [ ] Wait for the code to expire and verify the expired state
- [ ] Try an incorrect code → verify the error message
- [ ] Try empty content → verify the button stays disabled
- [ ] Try pasting a `javascript:alert(1)` URL → verify it's classified as text, not a link
- [ ] Verify the app works on mobile (portrait and landscape)

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: LabDrop v1.0"
git remote add origin https://github.com/YOUR_USERNAME/labdrop.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New" → "Project"**.
3. Select your `labdrop` repository.
4. Vercel auto-detects Vite. The defaults should work.
5. In **Environment Variables**, add:
   - `MONGODB_URI` — your Atlas connection string
   - `MONGODB_DB_NAME` — `labdrop`
   - `APP_ORIGIN` — your Vercel URL (e.g., `https://labdrop.vercel.app`)
6. Click **Deploy**.

### 3. After deployment

1. Visit your Vercel URL and test the Send → Receive flow.
2. Check the **Vercel Logs** tab for any errors.
3. Run the setup-db script locally (pointing to the production DB) if you haven't already:
   ```bash
   MONGODB_URI="your_production_uri" npm run setup-db
   ```

### 4. Updating

After code changes:
```bash
git add . && git commit -m "Your changes" && git push
```
Vercel auto-deploys on push.

After changing environment variables: go to **Vercel → Settings → Environment Variables**, update the value, then **redeploy** from the Deployments tab.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI environment variable is not set` | Make sure `.env` exists locally, or the variable is set in Vercel's Environment Variables |
| `MongoServerSelectionError: connection timed out` | Check MongoDB Atlas Network Access — your IP (or `0.0.0.0/0` for Vercel) must be allowed |
| `MongoServerError: Authentication failed` | Verify the database user credentials in your connection string |
| API returns 404 on Vercel | Check that `vercel.json` is in the project root and the API files are in `/api` |
| Refreshing a page returns 404 | The `vercel.json` rewrite rules should handle this. Verify the catch-all rewrite exists |
| Rate limit errors during testing | The rate limiter uses MongoDB. Wait for the window to expire, or temporarily increase the limits in env vars |
| `Cannot find module` errors | Run `npm install` again. Ensure you're using Node.js 18+ |
| Build fails on Vercel | Check the build logs. Common issues: missing dependencies, wrong Node version |

---

## Security considerations

### What LabDrop does

- **Hashes codes**: The 6-digit code is hashed with SHA-256 before storage. Only the hash is stored.
- **Rate limits**: Both creation and retrieval are rate-limited per IP using a shared MongoDB collection (works across serverless instances).
- **Validates input**: All content is validated server-side. URL schemes are restricted to `http:` and `https:`.
- **Prevents XSS**: Content is rendered as plain text using React's default escaping. No `dangerouslySetInnerHTML`.
- **Short-lived**: Shares expire after 10 minutes via MongoDB TTL + server-side expiration checks.
- **No history**: No share history is stored in the browser. Content is passed via React router state, not URL parameters.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control: no-store` on API responses.

### What LabDrop does NOT do

- **End-to-end encryption**: Content is stored in plaintext in the database. The database operator (you) can read it.
- **Guarantee privacy on public computers**: Closing the browser doesn't guarantee all traces are removed. Public computers may have monitoring software, keyloggers, or browser extensions.
- **Prevent code guessing**: A 6-digit code has 1 million possible values. Rate limiting makes brute-force impractical, but codes are not cryptographically strong identifiers. Do not share passwords, banking details, or highly sensitive information.

### Privacy statement

LabDrop is designed for convenience, not security. Use it to transfer everyday text and links between your devices. For sensitive information, use a proper encrypted channel.

---

## Free tier limits

| Service | Free tier | Limit |
|---------|-----------|-------|
| **Vercel** (Hobby) | Free | 100 GB bandwidth/month, 100K function invocations/month |
| **MongoDB Atlas** (M0) | Free | 512 MB storage, shared RAM, 100 connections |

These limits are more than sufficient for personal or small-lab use. If traffic grows significantly, you may need paid plans.

---

## License

ISC
