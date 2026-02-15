# 🚀 Deployment Guide (Free Tier)

This guide covers deploying the LTTS Test Portal using **MongoDB Atlas (Database)**, **Render (Backend)**, and **Vercel (Frontend)**.

---

## Phase 1: Database (MongoDB Atlas)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up.
2. **Create Cluster**: Select **Shared** (FREE) -> **M0 Sandbox**.
3. **Database Access**: Create a database user (e.g., `admin`) and password. **Save this password!**
4. **Network Access**: distinct "Allow Access from Anywhere" (`0.0.0.0/0`) for cloud connectivity.
5. **Get Connection String**:
   - Click **Connect** -> **Connect your application**.
   - Copy the string (e.g., `mongodb+srv://admin:<password>@cluster0...`).
   - Replace `<password>` with your actual password.

---

## Phase 2: Backend (Render)

1. **Create Account**: Go to [Render](https://render.com/) and sign up with GitHub.
2. **New Web Service**: Click **New +** -> **Web Service**.
3. **Connect Repo**: Select your GitHub repository.
4. **Settings**:
   - **Name**: `ltts-backend`
   - **Root Directory**: `server` (Important!)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. **Environment Variables** (Click "Advanced"):
   - `MONGO_URI`: (Paste your Atlas connection string)
   - `JWT_SECRET`: (Enter a random secret key)
   - `CORS_ORIGIN`: `https://your-frontend-project.vercel.app` (You can update this later after Vercel deployment, or use `*` temporarily)
   - `NODE_ENV`: `production`
6. **Deploy**: Click **Create Web Service**. Wait for "Live" status.
7. **Copy URL**: Copy your backend URL (e.g., `https://ltts-backend.onrender.com`).

---

## Phase 3: Frontend (Vercel)

1. **Create Account**: Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2. **Import Project**: Click **Add New** -> **Project** -> Import your repo.
3. **Settings**:
   - **Framework Preset**: `Angular`
   - **Root Directory**: `client` (Important!)
4. **Build Output Settings**:
   - Vercel usually auto-detects `dist/client/browser`. If it fails, override output to `dist/client/browser`.
5. **Environment Variables**:
   - Vercel requires a specific way to handle Angular environments at build time if not using the replacement file method, but **we configured `fileReplacements`** in `angular.json`.
   - **However**, we need to tell Angular the backend URL.
   - **Best Practice**: Go to `client/src/environments/environment.prod.ts` locally.
   - Update `apiUrl` to your **Render Backend URL**: `https://ltts-backend.onrender.com/api`.
   - Commit and push to GitHub.
6. **Deploy**: Vercel will auto-deploy on push.

---

## Phase 4: Final Config

1. Go back to **Render** Dashboard -> Environment Variables.
2. Update `CORS_ORIGIN` to your **Vercel Frontend URL** (e.g., `https://ltts-portal.vercel.app`) to strictly allow only your app.
3. **Done!** 🎉

---

## ⚡ Troubleshooting

- **Render Cold Start**: The free tier sleeps after 15 mins. The first request might take 30-50s. This is normal.
- **CORS Error**: Check `CORS_ORIGIN` in Render and ensure `environment.prod.ts` has the correct `https://` backend URL.
