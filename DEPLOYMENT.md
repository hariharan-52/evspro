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

### Step 4: Configure Permanent Cloud Database (Crucial for Vercel Persistence)

> ⚠️ **Why is a Cloud Database Required on Vercel?**
> Vercel runs on **stateless serverless microVMs**. Whenever a serverless container spins down (or after inactivity / browser refresh), any local in-memory files are recycled. 
> To store **every user registration, donation, and recycling request PERMANENTLY all the time across every tab and browser**, connect a free cloud MySQL database.

EcoDonate supports **1-Click Auto-Setup**: as soon as you connect your database, EcoDonate automatically builds all tables and seeds the demo data!

#### Option A: TiDB Cloud Serverless (100% Free Forever, No Credit Card)
1. Go to [tidbcloud.com](https://tidbcloud.com) and create a free account (or click **Storage ➜ Connect Store ➜ TiDB** in your Vercel project dashboard).
2. Create a free **Serverless Cluster** (takes ~20 seconds).
3. Click **Connect** ➜ Select **Connect with MySQL CLI / URL** and copy your connection string:
   `mysql://<username>:<password>@<host>:4000/<database>?ssl={"rejectUnauthorized":true}`
4. In your **Vercel Project Settings ➜ Environment Variables**, add:
   - **`DATABASE_URL`**: paste your TiDB connection string.
5. Redeploy! All users, donations, and requests are now stored permanently 24/7.

#### Option B: Other Cloud MySQL (Aiven, Railway, PlanetScale)
You can set either `DATABASE_URL` or individual variables:

| Variable Name | Example / Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mysql://user:pass@host:3306/ecodonate` | Full MySQL connection string with SSL |
| `DB_HOST` | `gateway.tidbcloud.com` or `mysql.railway.internal` | Remote MySQL host |
| `DB_USER` | `root` or cluster username | Remote database user |
| `DB_PASSWORD` | your database password | Remote database password |
| `DB_NAME` | `ecodonate` | Remote database name |
| `DB_PORT` | `4000` (TiDB) or `3306` (standard) | Database port |
| `JWT_SECRET` | `your-super-secret-jwt-key-2026` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |

---

### Step 5: Click Deploy
Click **Deploy** (or push to `main`). Vercel will build the React frontend and deploy the serverless `/api` backend. Once finished, you will receive your live URL.

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
