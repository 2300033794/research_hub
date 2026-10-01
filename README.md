# ResearchHub

A Reddit-style community for discovering, reading, and discussing scientific papers. Anyone can browse approved PDFs. Voting, comments, and paper submissions require an approved account; posting is limited to admins and users who have been granted researcher access.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind
- MongoDB / Mongoose
- Auth.js (email + Google)
- Cloudinary for PDF and thumbnail uploads

## Setup

1. Copy `.env.example` to `.env` and fill in MongoDB, `AUTH_SECRET`, Cloudinary, and optional Google OAuth.
2. Install dependencies: `npm install`
3. Seed categories (and an admin if `ADMIN_EMAIL` / `ADMIN_PASSWORD` are set): `npm run seed`
4. Start the app: `npm run dev`

Open [http://localhost:3000](http://localhost:3000).

## Accounts

- New email and Google sign-ups start as **pending** until an admin approves them.
- Admins can grant **research posting** separately from community access.
- Protected routes: `/submit`, `/settings`, `/notifications`. `/admin` is admin-only.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run seed
```
