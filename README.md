# Ganesh Mandal Pro

Multi-mandal cloud-ready Ganesh Mandal accounting app.

## Features
- Mandal registration/login
- Separate MongoDB data per mandal (`mandalId` tenant isolation)
- Current-year access expiry (31 December)
- Dashboard: total vargani, jama, cash, online, pending, expense, balance
- Vargani + pending/received workflow
- PDF receipt after saving contribution
- Expense management
- PDF income/expense report
- Marathi UI with Noto Sans Devanagari

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and add MongoDB Atlas URI + JWT secret.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:5000

## Render
Build command: `npm install`
Start command: `npm start`
Environment variables: `MONGODB_URI`, `JWT_SECRET`, optional `PORT`.

Important: Render's normal filesystem is ephemeral. The app generates PDFs on demand and stores them temporarily under `backend/generated`. For permanent cloud PDF storage, add S3/Cloudinary/Cloudflare R2 later.
