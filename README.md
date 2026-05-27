# Arshi GPS Vehicle Entry System

A professional internal web application for Arshi GPS staff to record GPS device installation and vehicle details.

---

## 🚀 How to Run

### Step 1 — Install All Dependencies

```bash
npm install
```

This will automatically install both **frontend** and **backend** dependencies.

### Step 2 — Start the App

```bash
npm start
```

This starts both servers at once:
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:5000

---

## 🔐 Login Credentials

| Field    | Value         |
|----------|---------------|
| Username | `arshigps`    |
| Password | `password123` |

---

## 📁 Project Structure

```
arshi-gps/
├── package.json              ← Root: runs both together
│
├── backend/
│   ├── server.js             ← Express server
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js           ← Login route
│   │   └── entries.js        ← Vehicle entry route
│   └── reports/
│       └── data.txt          ← All entries saved here (auto-created)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx          ← React entry point
        ├── App.jsx           ← Auth routing logic
        ├── api.js            ← Axios API functions
        ├── index.css         ← All styles
        └── components/
            ├── LoginPage.jsx ← Login screen
            └── Dashboard.jsx ← Form + Navbar
```

---

## 📄 Report File

All entries are saved and appended to:

```
backend/reports/data.txt
```

Each entry follows this format:

```
---

## ARSHI GPS VEHICLE ENTRY REPORT

IMEI              : XXXXX
RTO               : XXXXX
Vehicle Type      : XXXXX
Vehicle Make      : XXXXX
Vehicle Model     : XXXXX
Registration Year : XXXXX
Engine Number     : XXXXX
Chassis Number    : XXXXX
Vehicle Number    : XXXXX
Reference         : XXXXX
SIM 1             : XXXXX
SIM 2             : XXXXX

Date : DD/MM/YYYY
Time : HH:MM:SS AM/PM

---
```

---

## ⚙️ Tech Stack

| Layer     | Technology           |
|-----------|----------------------|
| Frontend  | React.js + Vite      |
| Styling   | Vanilla CSS          |
| HTTP      | Axios                |
| Backend   | Node.js + Express.js |
| Storage   | TXT File (fs module) |

---

## ✅ Features

- 🔐 Secure staff login
- 📋 12-field vehicle entry form with full validation
- ✨ Premium UI with 3D Glossy buttons and Glassmorphism
- 📊 Real-time Dashboard showing "Today's Entries" and Total Count
- ✏️ Edit Feature to easily correct any mistaken entries
- 💾 Auto-saves to JSON and generates formatted `reports/data.txt`
- 📥 1-Click Download of the formatted TXT report
- 🕐 Auto date & time stamp
- 🎉 Success popup after submission
- 📱 Mobile responsive design
