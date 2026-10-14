# 🌱 EcoDonate — Smart Waste Management & Donation Platform

> **"Give Waste a Second Life."**  
> A full-stack, AI-powered platform connecting donors with verified NGOs and recyclable waste with certified scrap dealers to build a sustainable, circular economy.

---

## 📖 Introduction & Overview

Unmanaged disposal of reusable household goods and recyclable materials contributes heavily to overflowing landfills, resource depletion, and environmental pollution. **EcoDonate** is an intelligent web application engineered to bridge the gap between conscientious citizens, certified charitable organizations (NGOs), and industrial scrap recyclers.

Equipped with an **AI-assisted waste classification engine**, the platform categorizes submissions into charitable donations (such as furniture, books, clothing, and electronics) and recyclable scrap (including plastic, metal, paper, glass, cardboard, and e-waste). EcoDonate provides automated doorstep pickup scheduling, live GPS address geocoding, verified organization matching, and real-time request lifecycle tracking. By streamlining the reuse and recycling lifecycle, EcoDonate fosters sustainable waste management and drives measurable carbon offset impact.

---

## 🌟 Key Highlights & Features

### 1. 🤖 AI-Powered Waste Classification
- **Intelligent Recognition**: Upload photos of recyclable waste to automatically detect material categories (Plastic, Paper, Metal, Glass, E-Waste, Cardboard) along with confidence metrics.
- **Auto-Populating Requests**: Eliminates user guesswork by instantly classifying items and selecting matching scrap categories for pickup.

### 2. 🤝 Dual Stream: Donations & Recycling
- **Donation Stream (For NGOs)**: Donate usable furniture, textbooks, clothing, and household goods. Specify item condition (*New*, *Like New*, *Good*, *Usable*), quantity, and pickup times.
- **Recycling Stream (For Scrap Dealers)**: Schedule bulk or domestic pickups for recyclable materials with weight/quantity estimates.

### 3. 🗺️ 1-Click GPS Location & Interactive Maps
- **Reverse Geocoding**: Integrated with browser Geolocation and OpenStreetMap Nominatim API to auto-fill street address, city, state, and pincode with a single click.
- **Leaflet Map Integration**: Visual location display for pickup planning and logistics coordination.

### 4. 🗄️ Dual-Engine Database Architecture (Zero-Config)
- **Automatic Engine Detection**: Automatically connects to remote **MySQL / TiDB / Aiven / PlanetScale** when configured via `DATABASE_URL`.
- **Zero-Config SQLite Fallback**: If no remote database is supplied, the platform falls back to an embedded WebAssembly SQLite engine (`sql.js`) with persistent file storage (`ecodonate_local.sqlite`).
- **Auto-Schema & Auto-Seed**: Automatically executes database schema migrations and seeds 9 demo accounts on initial launch.

### 5. 🔐 Zero-Lockout Triple-Tier Authentication
- **Multi-Identifier Login**: Sign in using **Email**, **Mobile Phone Number**, or **Username** paired with secure bcrypt password hashing.
- **Passwordless / Email OTP**: OTP verification for account confirmation and password reset workflows.
- **Google Firebase Integration**: Optional Google Sign-In and cloud synchronization via Firebase Authentication.
- **Rate-Limiting & Token Revocation**: Dedicated rate limiting to prevent brute-force attacks and in-memory JWT blacklist on logout.

### 6. 📊 Real-Time Impact Analytics & Dashboards
- **Environmental Impact Calculator**: Measures kilograms of waste diverted from landfills and computes estimated CO₂ emission reductions.
- **Visual Charts**: Interactive data visualizations powered by **Recharts** detailing monthly pickup trends, waste breakdown, and community contributions.

---

## 👥 User Roles & Capabilities

| Role | Key Capabilities |
| :--- | :--- |
| **👤 Donor (User)** | • Create donation and recycling requests with photo uploads and GPS location.<br>• View live AI material classification.<br>• Track request status (*Pending ➜ Accepted ➜ Scheduled ➜ Completed*).<br>• Monitor personal impact score, items donated, and CO₂ offset. |
| **🏢 NGO** | • Browse available community donation requests in local areas.<br>• Accept requests, schedule customized pickup dates, and confirm receipt.<br>• Manage organizational profile, registration certificates, and contact info.<br>• Access complete acceptance and distribution history. |
| **♻️ Scrap Dealer** | • Discover available scrap recycling requests filtered by accepted materials.<br>• Accept collection jobs and schedule logistics with donors.<br>• Record collected quantities (in kg or units) and update collection status.<br>• Track recycling metrics and business operational history. |
| **🛡️ Admin** | • Review and approve/reject pending registrations for NGOs and Scrap Dealers.<br>• Manage user accounts (activate, deactivate, delete, role assignment).<br>• Oversee all platform transactions, donations, and scrap collections.<br>• Access comprehensive analytics, monthly reports, and platform impact summaries. |

---

## 🔄 Platform Workflow

```mermaid
flowchart TD
    A[Citizen / Donor] -->|Upload Photo & Schedule Pickup| B{Item Category}
    
    B -->|Reusable Items: Clothes, Books, Furniture| C[Donation Request]
    B -->|Recyclables: Plastic, Metal, Paper, E-Waste| D[Recycling Request]
    
    D -->|Optional AI Analysis| E[AI Waste Classifier]
    E -->|Classified Category & Confidence| D
    
    C -->|Published to Feed| F[Verified NGOs]
    D -->|Published to Feed| G[Verified Scrap Dealers]
    
    F -->|Accept & Schedule Pickup| H[Pickup & Delivery]
    G -->|Accept & Schedule Pickup| H
    
    H -->|Status: Completed| I[Impact Engine]
    I -->|Calculates| J[Landfill Waste Diverted & CO₂ Saved]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6 |
| **Icons & UI** | Lucide React, React Hot Toast, Date-fns |
| **Maps & Charts** | Leaflet, React-Leaflet, Recharts, OpenStreetMap Nominatim API |
| **Backend** | Node.js, Express.js (REST API), Multer (Multipart File Uploads) |
| **Database** | MySQL 8.x / TiDB Cloud Serverless (Primary) • WebAssembly SQLite `sql.js` (Zero-Config Fallback) |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing, Nodemailer OTP, Google Firebase Auth |
| **Deployment** | Vercel (Monorepo Serverless Functions + Vite SPA), Docker/Node.js standalone |

---

## 📁 Project Directory Structure

```plaintext
ecodonate/
├── api/                       # Vercel serverless entry point
│   └── index.js               # Serverless handler proxying to backend Express app
├── backend/                   # Node.js Express backend application
│   ├── config/                # Database configuration (dual MySQL/SQLite engine)
│   ├── controllers/           # Route controllers (auth, donations, recycling, admin, etc.)
│   ├── data/                  # Persistent user registry & cached fallback state
│   ├── middleware/            # JWT auth, role validation, rate limiting, multer uploads
│   ├── routes/                # Express API route declarations
│   ├── services/              # AI classifier, email service, Firebase integrations
│   ├── app.js                 # Express application initialization & middleware
│   ├── server.js              # Local HTTP development server
│   └── package.json           # Backend dependencies
├── database/                  # Relational database scripts
│   ├── schema.sql             # MySQL schema definitions
│   └── seed.sql               # Demo database seed data (9 sample accounts)
├── frontend/                  # React + Vite frontend application
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Sidebar, Maps, Cards)
│   │   ├── context/           # AuthContext & NotificationContext providers
│   │   ├── hooks/             # Custom React hooks (useAuth)
│   │   ├── layouts/           # Public and Dashboard page layouts
│   │   ├── pages/             # Route pages (Admin, Auth, NGO, Scrap Dealer, User, Public)
│   │   ├── services/          # Axios API client & Firebase services
│   │   ├── utils/             # Helper utilities, GPS location services, constants
│   │   ├── App.jsx            # Top-level routing & layout definitions
│   │   └── main.jsx           # React DOM root entry
│   └── package.json           # Frontend dependencies
├── DEPLOYMENT.md              # Detailed Vercel & TiDB Cloud deployment guide
├── vercel.json                # Vercel monorepo configuration & route rewrites
├── package.json               # Root monorepo configuration & unified scripts
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (v9.x or later)
- *(Optional)* MySQL 8.x (only if not using the default zero-configuration SQLite engine)

---

### Quickstart (Zero Configuration)

EcoDonate runs out of the box with zero external database configuration required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hariharan-52/evspro.git ecodonate
   cd ecodonate
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```
   * This concurrently launches:
     * **Backend API**: `http://localhost:5000`
     * **Frontend Web App**: `http://localhost:5173`

---

### Optional: Running with MySQL / TiDB Cloud

To connect a persistent MySQL or TiDB cloud instance:

1. Create a MySQL database named `ecodonate`.
2. Configure your environment variables in `.env` (or `backend/.env`):
   ```env
   DATABASE_URL=mysql://username:password@localhost:3306/ecodonate
   ```
   *(Or specify individual `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` variables)*
3. Import the schema and seed data manually if desired:
   ```bash
   mysql -u root -p ecodonate < database/schema.sql
   mysql -u root -p ecodonate < database/seed.sql
   ```
   *(Note: If the database is empty, EcoDonate will automatically run table migrations and seed demo data on first connection!)*

---

## 🔑 Pre-Seeded Demo Accounts

You can test any role immediately using these pre-configured credentials:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@ecodonate.com` | `Admin@123` | Full administrative controls, NGO/dealer verifications, analytics |
| **👤 User (Donor)** | `rahul@example.com` | `Password@123` | Donate items, recycle scrap, live GPS location, impact records |
| **👤 User (Donor 2)** | `harihari@gmail.com` | `Password@123` | Active donor profile with existing request history |
| **🏢 NGO (Approved)** | `contact@greenearth.org` | `Password@123` | Review and accept donation requests, schedule collections |
| **🏢 NGO (Approved 2)** | `hariharingo@gmail.com` | `Password@123` | Manage donations and track delivery milestones |
| **♻️ Scrap Dealer (Approved)** | `info@ecoscrap.com` | `Password@123` | Accept recycling requests, update weight & collection status |
| **♻️ Scrap Dealer (Approved 2)** | `harihariscrap@gmail.com` | `Password@123` | Review scrap materials (Metal, Paper, E-Waste) |
| **⏳ NGO (Pending Review)** | `pendingngo@example.com` | `Password@123` | Simulates an organization awaiting admin verification |
| **⏳ Scrap Dealer (Pending Review)** | `pendingscrap@example.com` | `Password@123` | Simulates a recycling business awaiting admin verification |

---

## ⚙️ Environment Variables Reference

### Backend / Root (`.env` or `backend/.env`)

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin for frontend SPA |
| `DATABASE_URL` | `mysql://user:pass@host:3306/ecodonate` | Full MySQL connection string with SSL support |
| `DB_HOST` | `localhost` | Fallback MySQL host |
| `DB_PORT` | `3306` | Fallback MySQL port |
| `DB_USER` | `root` | Fallback MySQL user |
| `DB_PASSWORD` | `password` | Fallback MySQL password |
| `DB_NAME` | `ecodonate` | Database schema name |
| `JWT_SECRET` | `your_secret_key` | Secret key used to sign JWT authentication tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity timeframe |
| `SMTP_HOST` | `smtp.gmail.com` | *(Optional)* Custom SMTP host for OTP verification emails |
| `SMTP_USER` | `user@example.com` | *(Optional)* SMTP username |
| `SMTP_PASS` | `password` | *(Optional)* SMTP password/app key |

### Frontend (`frontend/.env`)

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `/api` | Base URL for backend API requests |
| `VITE_FIREBASE_API_KEY` | `your_firebase_api_key` | Firebase API key for optional Google Sign-in |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | `project_id` | Firebase project identifier |

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register-request` — Register a new User, NGO, or Scrap Dealer
- `POST /api/auth/verify-registration-otp` — Verify registration OTP code
- `POST /api/auth/login` — Sign in with Email/Phone/Username + Password
- `POST /api/auth/google-login` — Sign in with Google Firebase credential token
- `POST /api/auth/forgot-password/send-otp` — Request a password reset OTP
- `POST /api/auth/forgot-password/reset` — Reset password with verified OTP
- `GET  /api/auth/me` — Retrieve the currently authenticated user's session
- `POST /api/auth/logout` — Revoke session token and sign out

### 🎁 Donations (`/api/donations`)
- `POST  /api/donations` — Create a donation request with photo upload
- `GET   /api/donations` — Fetch available donation requests (filtered by status/role)
- `GET   /api/donations/my` — Fetch donation requests created by current user
- `GET   /api/donations/:id` — Retrieve donation details by ID
- `PATCH /api/donations/:id/status` — Update status (*Accepted, Scheduled, Received, Completed*)

### ♻️ Recycling (`/api/recycling`)
- `POST  /api/recycling` — Create a scrap recycling request with photo and quantity
- `GET   /api/recycling` — Fetch available recycling requests
- `GET   /api/recycling/:id` — Retrieve recycling request details
- `PATCH /api/recycling/:id/status` — Update status (*Accepted, Scheduled, Collected, Completed*)

### 🏢 NGOs & Scrap Dealers (`/api/ngos`, `/api/scrap-dealers`)
- `GET   /api/ngos` — List verified NGOs
- `GET   /api/ngos/dashboard` — Fetch statistics and requests for authenticated NGO
- `PUT   /api/ngos/profile` — Update NGO profile and contact information
- `PATCH /api/ngos/:id/verify` — Admin approval/rejection of NGO registration
- `GET   /api/scrap-dealers` — List verified scrap dealers
- `GET   /api/scrap-dealers/dashboard` — Fetch dashboard metrics for authenticated dealer
- `PUT   /api/scrap-dealers/profile` — Update dealer accepted materials and profile
- `PATCH /api/scrap-dealers/:id/verify` — Admin approval/rejection of scrap dealer

### 🛡️ Administration & Analytics (`/api/admin`, `/api/impact`)
- `GET   /api/admin/dashboard` — Platform overview KPI counters
- `GET   /api/admin/stats/monthly` — Monthly volume trends
- `GET   /api/admin/stats/waste-categories` — Material distribution metrics
- `GET   /api/admin/verifications/pending` — List pending NGO and dealer approvals
- `GET   /api/impact/platform` — Total waste diverted, carbon emissions offset, and item counts
- `GET   /api/impact/user` — Personal impact metrics for authenticated donor

---

## ☁️ Deployment

EcoDonate is built for **1-click monorepo deployment on Vercel**:

1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** ➜ **Import**.
3. Vercel automatically detects `vercel.json` and builds both the React Vite frontend and `/api` serverless backend.
4. In **Project Settings ➜ Environment Variables**, add your `DATABASE_URL` (e.g., from [TiDB Cloud Serverless](https://tidbcloud.com) for 100% free permanent MySQL cloud hosting).
5. For step-by-step instructions and troubleshooting, see [DEPLOYMENT.md](file:///c:/Users/RAJIN/.gemini/antigravity/scratch/ecodonate/DEPLOYMENT.md).

---

## 📄 License & Attribution

This project is licensed under the **MIT License**.  
© 2026 **EcoDonate**. *Small actions. Big impact.*
