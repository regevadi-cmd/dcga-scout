# Deployment Guide: DCGA Scout

This guide will help you publish your agent to the web so others can try it out.
We will use **Render** for the Backend (Python) and **Vercel** for the Frontend (React). Both have excellent free tiers.

## Prerequisites
1.  **GitHub Account:** You need to push your code to a GitHub repository.
2.  **Render Account:** Sign up at [render.com](https://render.com).
3.  **Vercel Account:** Sign up at [vercel.com](https://vercel.com).

---

## Step 1: Push Code to GitHub
1.  Create a new repository on GitHub.
2.  Push your `DCGA Agent` folder to this repository.
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin <your-repo-url>
    git push -u origin main
    ```

---

## Step 2: Deploy Backend (Render)
1.  Go to your **Render Dashboard** and click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Root Directory:** `backend` (Important!)
4.  **Runtime:** Python 3
5.  **Build Command:** `pip install -r requirements.txt`
6.  **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
7.  **Environment Variables:** (Scroll down to "Advanced")
    *   Add `TAVILY_API_KEY` = `tvly-...` (Copy from your .env)
    *   Add `GEMINI_API_KEY` = `...` (Copy from your .env)
8.  Click **Create Web Service**.
9.  Wait for it to deploy. Once live, copy the **Service URL** (e.g., `https://dcga-backend.onrender.com`).

---

## Step 3: Configure Frontend
1.  Open `frontend/vercel.json` in your code editor.
2.  Replace `https://YOUR-BACKEND-URL.onrender.com` with the actual URL you just copied from Render.
3.  Commit and push this change to GitHub:
    ```bash
    git add frontend/vercel.json
    git commit -m "Update backend URL"
    git push
    ```

---

## Step 4: Deploy Frontend (Vercel)
1.  Go to your **Vercel Dashboard** and click **Add New...** -> **Project**.
2.  Import your GitHub repository.
3.  **Root Directory:** Click "Edit" and select `frontend`.
4.  **Framework Preset:** It should auto-detect "Vite".
5.  Click **Deploy**.

---

## 🎉 Done!
Vercel will give you a live URL (e.g., `https://dcga-scout.vercel.app`).
Share this link with your team!
