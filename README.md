# MedExplain AI

AI-powered health companion — symptom checker, prescription scanner, medical report translator, and more.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + MongoDB Atlas + Mongoose
- **AI**: Google Gemini 2.0 Flash

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone & install

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 2. Configure environment

```bash
# Root .env (frontend)
VITE_API_URL=http://localhost:5000/api

# backend/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:8080
```

### 3. Run both servers

```bash
npm run dev:all
```

- Frontend: http://localhost:8080
- Backend: http://localhost:5000

---

## Production Deployment

### Backend (Railway / Render / Fly.io)

1. Deploy the `backend/` folder
2. Set all env vars from `backend/.env.example`
3. Set `NODE_ENV=production`
4. Start command: `node src/index.js`

### Frontend (Vercel / Netlify)

1. Build command: `npm run build`
2. Output directory: `dist`
3. Set env var: `VITE_API_URL=https://your-backend-url.com/api`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Min 32 chars random string |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `FRONTEND_URL` | ✅ | Deployed frontend URL (for CORS) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `PORT` | — | Defaults to 5000 |
