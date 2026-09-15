# 🚀 EcoDonate Vercel Deployment Guide

EcoDonate is fully configured for **1-Click Monorepo Deployment** on **Vercel** (both Frontend SPA and Serverless Backend API).

---

## ⚡ Method 1: Deploy with Vercel Web Dashboard (Recommended)

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure your latest code is pushed to your Git repository:
```bash
git add .
git commit -m "Configure fullstack Vercel deployment"
git push origin main
```

### Step 2: Import Project into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** ➜ **"Project"**.
3. Select your Git repository from the list and click **Import**.

### Step 3: Configure Project Settings on Vercel
- **Framework Preset**: `Vite` (or `Other`)
- **Root Directory**: `./` (leave as root)
- **Build Command**: `npm run build` *(auto-detected via `vercel.json`)*
- **Output Directory**: `frontend/dist` *(auto-detected via `vercel.json`)*
- **Install Command**: `npm install`

### Step 4: Add Environment Variables (Optional / Recommended)
Under **Environment Variables** in the Vercel project configuration, you can add:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `JWT_SECRET` | *e.g. `your-super-secret-jwt-key-2026`* | Secret key for JWT signing (a secure default fallback is built-in) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `DB_HOST` | *Optional (e.g. `aws.connect.psdb.cloud`)* | Remote MySQL host (PlanetScale / Aiven / TiDB / Supabase / Railway) |
| `DB_USER` | *Optional MySQL user* | Remote MySQL database username |
| `DB_PASSWORD` | *Optional MySQL password* | Remote MySQL database password |
| `DB_NAME` | `ecodonate` | Remote MySQL database name |
| `DB_PORT` | `3306` | Remote MySQL database port |

> 💡 **Plug & Play Embedded DB**: If no MySQL database environment variables are configured, EcoDonate will automatically boot with its **embedded serverless SQLite database** containing pre-seeded users, donations, recycling requests, and demo accounts!

### Step 5: Click Deploy
Click **Deploy**. Vercel will build the React frontend and bundle the serverless `/api` routes in ~1 minute. Once finished, you will receive your live `https://ecodonate-xxx.vercel.app` URL.

---

## 💻 Method 2: Deploy Using Vercel CLI

1. Install the Vercel CLI globally:
```bash
npm install -g vercel
```

2. Log in to Vercel:
```bash
vercel login
```

3. Deploy from the project root:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

---

## 🔑 Demo Login Accounts

Once deployed, you can immediately test all features using these seeded demo credentials:

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ecodonate.com` | `Admin@123` | Full dashboard, verify NGOs & dealers, analytics |
| **User** | `rahul@example.com` | `Password@123` | Donate items, recycle waste, live GPS location, track impact |
| **NGO (Approved)** | `contact@greenearth.org` | `Password@123` | Manage donation requests, update pickup & status |
| **Scrap Dealer (Approved)** | `info@ecoscrap.com` | `Password@123` | Manage recycling requests, view collection history |

---

## 🌐 API Verification Endpoint

After deployment, test your backend serverless health by opening:
```
https://<your-vercel-domain>.vercel.app/api/health
```
Expected response:
```json
{
  "status": "ok",
  "message": "EcoDonate API is operational",
  "environment": "vercel-serverless",
  "timestamp": "2026-09-15T..."
}
```
