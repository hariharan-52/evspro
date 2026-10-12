# 🌱 EcoDonate

> **"Give Waste a Second Life."**

EcoDonate is a full-stack eco-friendly waste management and donation platform. It connects donors with NGOs, recyclable waste with scrap dealers, and promotes sustainable waste management through technology.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MySQL 8.x |
| Auth | JWT + bcrypt |

---

## 🚀 Quick Setup

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend
```bash
cd backend
# Edit .env and set DB_PASSWORD to your MySQL root password
npm install
npm run dev
# Starts at http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 🔑 Authentication Methods

EcoDonate offers a modern, versatile authentication system designed for speed, security, and zero lockout:

### 1. 📱 Passwordless One-Time Code (OTP) — *Recommended*
- Enter your mobile phone number or email address.
- Click **"Get Verification Code"**.
- Input the 6-digit verification code (or tap the on-screen auto-fill chip) for instant, passwordless sign-in or 10-second account creation.

### 2. 🔑 Direct Password Authentication
- Sign in with your **Email Address**, **Mobile Phone Number**, or **User Name** + Password.

---

## 👥 User Roles

- **User** — Donate items & create recycling requests
- **NGO** — Receive and manage donation requests only
- **Scrap Dealer** — Receive and manage recycling requests only
- **Admin** — Full platform management, verify accounts, view reports

---

## 🌍 Environmental Mission

EcoDonate promotes:
- Reduction of landfill waste
- Reuse of unwanted items
- Proper recycling of waste materials
- Connection between donors, NGOs, and recyclers
- Environmental awareness through technology

---

## 🤖 AI Classification Note

The AI waste classifier is a **mock service** for demonstration. To connect a real ML model, edit `backend/services/aiClassifier.js` and replace the mock logic with your ML API call.

## 🔥 Firebase Setup

To enable Firebase features (Authentication, Firestore, Storage):

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Register a Web App and copy your config keys.
3. In `frontend/`, create `.env` using `frontend/.env.example` as a template:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Firebase services are ready to import from [`frontend/src/services/firebase.js`](frontend/src/services/firebase.js).

---

© 2026 EcoDonate. *Small actions. Big impact.*


