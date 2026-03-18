# Luma Website

Landing page for the Luma journaling app — built with Next.js 14, TypeScript, and Three.js.

## Run locally in VS Code

1. Open this folder in VS Code
2. Open the terminal (`Ctrl + ~`)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open **http://localhost:3000** in your browser

The 3D room will render fully in the browser. Hot reload is enabled — any changes you save will update instantly.

## Project structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout, fonts, metadata
│   ├── page.tsx         # Main page — composes all sections
│   └── globals.css      # CSS variables, reset, keyframes
└── components/
    ├── ThreeRoom.tsx     # Full Three.js room (the 3D scene)
    ├── Hero.tsx          # Hero section with scene/view toggles
    ├── Navbar.tsx        # Fixed top navigation
    ├── Strip.tsx         # Feature tagline strip
    ├── Features.tsx      # 6-card features grid
    ├── Philosophy.tsx    # Quote section
    ├── HowItWorks.tsx    # 3-step how it works
    ├── Download.tsx      # Download CTA
    └── Footer.tsx        # Footer with links
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Vercel auto-detects Next.js — just click **Deploy**

## Connect your subdomain (luma.effortless.quest)

1. In Vercel → your project → **Settings → Domains**
2. Add `luma.effortless.quest`
3. Copy the CNAME record Vercel gives you (something like `cname.vercel-dns.com`)
4. Go to your DNS provider and add that CNAME record for the `luma` subdomain
5. Wait a few minutes — done!
