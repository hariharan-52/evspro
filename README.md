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

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ecodonate.com | Admin@123 |
| **User** | rahul@example.com | Password@123 |
| **NGO (Approved)** | contact@greenearth.org | Password@123 |
| **Scrap Dealer (Approved)** | info@ecoscrap.com | Password@123 |

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

---

© 2026 EcoDonate. *Small actions. Big impact.*















