<div align="center">

```
████████╗███████╗███╗   ███╗██████╗ ██╗      ██████╗  █████╗ ██████╗
╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗
   ██║   █████╗  ██╔████╔██║██████╔╝██║     ██║   ██║███████║██║  ██║
   ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║     ██║   ██║██╔══██║██║  ██║
   ██║   ███████╗██║ ╚═╝ ██║██║     ███████╗╚██████╔╝██║  ██║██████╔╝
   ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝
```

<h3>⚡ Secure. Ephemeral. PIN-Protected File Sharing. ⚡</h3>

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-API-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-▶_Try_Now-blueviolet?style=for-the-badge)](#)

</div>

---

## 🧠 What is Tempload?

> **Tempload** is a blazing-fast, browser-based file-drop platform. No accounts. No sign-ups. No permanent storage. Just drop your files, pick a username and PIN, and share the link. The recipient enters the username and PIN — and the file is theirs.

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOW TEMPLOAD WORKS                         │
│                                                                 │
│  [You]  →  Drop File(s)  →  Choose Username + 4-digit PIN       │
│           → Upload → Secure Share URL Generated                 │
│                             ↓                                   │
│  [Them] →  Enter Username → Enter PIN → File Unlocked 🔓        │
│                                                                 │
│  ⏱ Files auto-expire after 24 hours. Zero trace. Zero bloat.   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features at a Glance

| Feature | Details |
|---|---|
| 🚀 **Zero-Login Sharing** | No accounts required — just a username and PIN |
| 🔐 **PIN-Gated Downloads** | Files are locked behind a 4-digit PIN |
| 📦 **Multi-File ZIP** | Drop multiple files → auto-zipped in-browser before upload |
| ⚡ **Chunked Multipart Upload** | Large files (>80MB) use intelligent multipart upload |
| 📧 **Email Notification** | Optionally email the recipient the link, credentials, or file |
| 📱 **QR Code Share** | After upload, scan the QR code with mobile for instant access |
| 🌐 **Cloudflare Edge API** | Backend lives on Cloudflare Workers — globally distributed |
| ⏳ **Auto-Expiry** | Every payload auto-deletes after 24 hours |
| 🎨 **Animated UI** | Particle effects, animated beams, glassmorphism cards |
| 📂 **ZIP Preview** | Zipped payloads are listed file-by-file on the receive page |

---

## 🗂 Project Architecture

```
tempload-frontend/
│
├── 📁 src/
│   ├── 📁 pages/
│   │   ├── UploadPage.jsx       ← Upload UI: file drop, username, PIN, email
│   │   ├── DownloadPage.jsx     ← Receive UI: username lookup → PIN unlock
│   │   └── SharePage.jsx        ← Public share link page (/v/:username)
│   │
│   ├── 📁 components/ui/
│   │   ├── BackgroundBeams.jsx  ← Animated SVG beam background
│   │   ├── SparklesCore.jsx     ← tsParticles sparkle effect for logo
│   │   ├── NavTabs.jsx          ← Upload / Receive navigation tabs
│   │   ├── FileUploadZone.jsx   ← Drag-and-drop file zone
│   │   ├── VanishInput.jsx      ← Animated placeholder input
│   │   ├── NoiseBackground.jsx  ← Canvas noise gradient for buttons
│   │   ├── DottedGlowBackground.jsx  ← Dotted glow card bg
│   │   ├── HoverBorderGradient.jsx   ← Gradient border on hover
│   │   └── LogoSVG.jsx          ← TL logo SVG component
│   │
│   ├── 📁 lib/
│   │   ├── api.js               ← All API calls (upload, download, meta…)
│   │   └── zip.js               ← In-browser ZIP build & extraction (fflate)
│   │
│   ├── 📁 styles/               ← CSS modules organized by concern
│   │   ├── index.css
│   │   ├── base/
│   │   ├── components/
│   │   ├── layout/
│   │   └── pages/
│   │
│   ├── App.jsx                  ← Root component, routing, header
│   └── main.jsx                 ← React entry point
│
├── index.html                   ← HTML shell + font preloads
├── vite.config.js               ← Vite config + dev proxy to Worker API
├── package.json
├── .env.local                   ← 🔒 Local env vars (never committed)
└── .gitignore
```

---

## 🔌 Backend API — Cloudflare Worker

> Tempload's backend lives entirely on **Cloudflare Workers** with **R2 object storage** for file blobs and **KV** (or D1) for metadata. No traditional server. No cold starts. Pure edge.

### API Endpoints

```
POST  /api/upload          → Simple upload (file ≤ 80 MB)
POST  /api/mpu/init        → Initialize multipart upload session
PUT   /api/mpu/part        → Upload a single part/chunk
POST  /api/mpu/complete    → Finalize multipart upload
POST  /api/mpu/abort       → Abort a multipart session

GET   /api/meta?username=  → Fetch file metadata (no PIN needed)
POST  /api/download        → Download the file (PIN required)
POST  /api/text            → Retrieve text payload (PIN required)
POST  /api/email           → Send email notification post-upload
```

### Request Flow Diagram

```
Browser                          Cloudflare Worker           R2 Storage
  │                                     │                        │
  │──POST /api/upload──────────────────►│                        │
  │  { file, username, pin, email? }    │──PUT object───────────►│
  │                                     │◄─ ETag / key ──────────│
  │◄─ { ok, shareUrl, username, ... } ──│                        │
  │                                     │                        │
  │──GET /api/meta?username=X ─────────►│                        │
  │◄─ { kind, size, expiresAt } ────────│                        │
  │                                     │                        │
  │──POST /api/download { username, pin}│                        │
  │                                     │──GET object───────────►│
  │◄─ Binary blob (file stream) ─────── │◄── blob ───────────────│
```

---

## 🚀 Getting Started — Local Development

> Follow these steps **exactly** to run Tempload on your own machine.

### 📋 Prerequisites

Before you begin, make sure you have:

```
✅ Node.js  v18 or higher  →  https://nodejs.org
✅ npm      v9+            →  comes with Node.js
✅ Git                     →  https://git-scm.com
✅ A terminal (PowerShell, CMD, bash — all work)
```

Check your versions:
```bash
node -v    # Should show v18.x.x or higher
npm -v     # Should show 9.x.x or higher
git --version
```

---

### 🪜 Step 1 — Clone the Repository

```bash
git clone https://github.com/MaazSohail11/Tempload.git
cd Tempload
```

---

### 🪜 Step 2 — Install Dependencies

```bash
npm install
```

> This installs React 19, Vite 7, tsParticles, fflate, qrcode.react, motion, and all other packages from `package.json`.

Expected output:
```
added 312 packages, and audited 313 packages in 15s
found 0 vulnerabilities
```

---

### 🪜 Step 3 — Configure Environment Variables

Create a file called `.env.local` in the project root:

```bash
# On Windows (PowerShell):
New-Item .env.local

# On Mac/Linux:
touch .env.local
```

Then open `.env.local` and paste:

```env
# The URL of your Cloudflare Worker backend
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev

# The base URL of YOUR local or hosted frontend
VITE_PUBLIC_BASE_URL=http://localhost:5173

# Optional: max upload size in MB (default 500)
VITE_MAX_MB=500
```

> ⚠️ **IMPORTANT**: Set `VITE_API_BASE_URL` to your own Cloudflare Worker URL. You must deploy your own backend — see the Backend section below.

> ⚠️ `.env.local` is in `.gitignore` and will never be pushed to GitHub. Keep it secret.

---

### 🪜 Step 4 — Start the Dev Server

```bash
npm run dev
```

You should see:

```
  VITE v7.x.x  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### 🪜 Step 5 — Open in Browser

```
http://localhost:5173
```

🎉 Tempload is now running locally! The dev server auto-proxies all `/api/...` requests to the Cloudflare Worker backend, so everything works out of the box.

---

## 🧪 Using Tempload — Walkthrough

### 📤 Uploading a File

```
1. Open http://localhost:5173
2. Drag & drop one or more files onto the upload zone
   → Multiple files are automatically zipped in-browser
3. Enter a USERNAME (3-20 chars, A-Z, 0-9, _ or -)
   Example: JOHN-PDF
4. Enter a 4-DIGIT PIN
   Example: 7823
5. (Optional) Click "▼ Email after upload" to send the link by email
6. Click  "Upload & Generate Link →"
7. Copy the share URL or scan the QR code
```

### 📥 Receiving / Downloading a File

```
1. Open http://localhost:5173/download  OR  click "Receive" in the nav
2. Enter the USERNAME the sender gave you
3. Click the → button
4. Enter the 4-digit PIN
5. Click the → button again
6. Your file(s) appear — download individually or as a ZIP
```

### 🔗 Share Link Format

After upload, a share link is generated in this format:

```
https://your-domain.com/v/JOHN-PDF
```

When someone opens this link, they land on the SharePage which pre-fills the username and prompts for PIN.

---

## 🏗️ Building for Production

```bash
npm run build
```

Output goes to `dist/`. The build uses Rollup (via Vite) with manual chunk splitting:

| Chunk | Contents |
|---|---|
| `react-vendor` | react, react-dom, react-router-dom |
| `animation-vendor` | motion, tsParticles |
| `crypto-vendor` | fflate (ZIP engine) |
| `index` | App code |

Preview the production build locally:
```bash
npm run preview
```

---

## 🚢 Deployment

### Deploy Frontend to Cloudflare Pages

```bash
# Build first
npm run build

# Deploy dist/ to Cloudflare Pages via Wrangler
npx wrangler pages deploy dist --project-name=tempload
```

Or connect your GitHub repo to **Cloudflare Pages** in the dashboard for automatic deploys on push.

### Backend (Cloudflare Workers)

The API is a separate Cloudflare Worker. To deploy your own:

```bash
# In your worker project directory:
npx wrangler deploy
```

Set these secrets in the Cloudflare dashboard or via CLI:
```bash
wrangler secret put R2_BUCKET_NAME
wrangler secret put KV_NAMESPACE_ID
wrangler secret put RESEND_API_KEY     # for email
```

---

## 🔐 Security Model

```
┌────────────────────────────────────────────────┐
│              TEMPLOAD SECURITY                 │
│                                                │
│  ✅ No server-side sessions or cookies         │
│  ✅ Files gated by username + PIN combination  │
│  ✅ Auto-deletion after 24 hours               │
│  ✅ No user accounts or persistent identity    │
│  ✅ HTTPS enforced on all API calls            │
│  ✅ Env secrets never committed to Git         │
│                                                │
│  ⚠️  PIN is 4 digits — share it privately      │
│  ⚠️  Links are guessable by username — use     │
│      non-obvious usernames for sensitive files │
└────────────────────────────────────────────────┘
```

---

## 🧩 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.2 | UI framework |
| `react-router-dom` | 7.13 | Client-side routing |
| `vite` | 7.3 | Dev server + bundler |
| `motion` | 12.35 | Animations |
| `@tsparticles/react` | 3.0 | Particle effects (logo sparkles) |
| `fflate` | 0.8 | In-browser ZIP compression/extraction |
| `qrcode.react` | 4.2 | QR code generation for share links |
| `pdf-lib` | 1.17 | PDF utilities |
| `pdfjs-dist` | 5.5 | PDF rendering |

---

## 🛠️ NPM Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:5173` |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on source files |

---

## 📁 File Upload Limits

| Upload Mode | Trigger | Behavior |
|---|---|---|
| Simple Upload | File ≤ 80 MB | Single `POST /api/upload` with FormData |
| Chunked Multipart | File > 80 MB | Init → Upload Parts (20MB each) → Complete |
| Max Size | 500 MB (default) | Configurable via `VITE_MAX_MB` env var |
| Multi-File | Any number of files | Zipped client-side to a single `.zip` before upload |

---

## 🤝 Contributing

Pull requests are welcome! To contribute:

```bash
# 1. Fork this repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Tempload.git
cd Tempload

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes, then commit
git add .
git commit -m "feat: describe your change"

# 5. Push and open a PR
git push origin feature/your-feature-name
```

Please follow the existing code style and ensure `npm run lint` passes before submitting.

---

## 📜 License

MIT License © 2025 Maaz Sohail

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

---

<div align="center">

**Built with ❤️ using React, Vite & Cloudflare Workers**

[⬆ Back to Top](#)

</div>
