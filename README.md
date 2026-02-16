<p align="center">
  <h1 align="center">💰 FinTrack Cloud</h1>
  <p align="center">A modern, glassmorphism-styled personal finance tracker built with Vanilla JavaScript and Firebase.</p>
</p>

<p align="center">
  <a href="https://expense-tracker-2026-787c9.web.app">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blueviolet?style=for-the-badge" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/version-1.1.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Firebase-Hosted-orange?style=for-the-badge&logo=firebase" alt="Firebase">
</p>

---

## ✨ Features

| Feature | Description |
|---------|------------|
| 🔐 **Secure Auth** | Email/password authentication with Firebase |
| 💸 **Track Expenses** | Add, edit, and delete transactions with categories |
| 💰 **Track Income** | Separate income tracking with smart type selector |
| 💳 **Payment Methods** | Create and manage custom payment sources (up to 20) |
| 📊 **Live Dashboard** | Real-time summary cards — Today, Weekly, Monthly breakdown |
| 🥧 **Spend Analysis** | Interactive pie chart by expense category |
| 📄 **PDF Export** | Download professional bank-statement style reports |
| 📅 **Weekly Reports** | In-app financial summaries every Monday |
| 🎨 **Glassmorphism UI** | Modern, premium design with blur effects and gradients |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Backend** | Firebase Authentication, Cloud Firestore |
| **Hosting** | Firebase Hosting (Global CDN, SSL) |
| **Charts** | Chart.js 4.3.0 |
| **PDF** | jsPDF + jsPDF-AutoTable |
| **Architecture** | Modular ES6, Real-time listeners, Client-side rendering |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

### Setup

```bash
# Clone the repo
git clone https://github.com/infin2004/expense-tracker.git
cd expense-tracker

# Install Firebase tools (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Start local dev server
firebase serve
```

Visit `http://localhost:5000` in your browser.

### Deploy

```bash
firebase deploy
```

---

## 📁 Project Structure

```
expense-tracker/
├── public/
│   ├── css/
│   │   └── styles.css          # Glassmorphism theme & responsive styles
│   ├── js/
│   │   ├── auth.js             # Authentication (signup/login/logout)
│   │   ├── dashboard.js        # Main dashboard logic & transaction CRUD
│   │   ├── form-init.js        # Form initialization & type switching
│   │   ├── payment-methods.js  # Custom payment method management
│   │   ├── pdf-service.js      # PDF report generation
│   │   ├── report-service.js   # Weekly report data processing
│   │   └── weekly-report.js    # In-app weekly report modal
│   ├── index.html              # Main application page
│   ├── privacy.html            # Privacy policy
│   └── terms.html              # Terms of service
├── firestore.rules             # Firestore security rules
├── firebase.json               # Firebase configuration
└── .gitignore
```

---

## 🗄️ Database Schema

```
/users/{userId}
  ├── email: string
  ├── paymentMethods: string[] (max 20)
  ├── lastReportDate: Timestamp
  └── createdAt: Timestamp

  /transactions/{transactionId}
    ├── amount: number (positive = expense, negative = income)
    ├── category: string
    ├── payment_source: string
    ├── date: Timestamp
    ├── description: string
    └── createdAt: Timestamp
```

---

## 🔒 Security

- **Firestore Rules** — User-level data isolation, server-side validation
- **Input Sanitization** — XSS protection via `sanitizeInput()` and `escapeHtml()`
- **Authentication** — Firebase Auth with secure token management
- **No Server-Side Code** — All processing happens client-side, zero data exposure

---

## 🎨 Design

- **Theme**: Purple-to-blue gradient with glassmorphism overlays
- **Cards**: Semi-transparent backgrounds with `backdrop-filter: blur()`
- **Colors**: Green (#51cf66) for income, Red (#ff6b6b) for expenses
- **Typography**: System fonts with monospace currency formatting
- **Animations**: Smooth 0.3s ease transitions throughout

---

## 📈 Roadmap

- [ ] PWA Support (installable on mobile)
- [ ] Budget limits per category
- [ ] Search & filter transactions
- [ ] Monthly trends line chart
- [ ] Dark/Light mode toggle
- [ ] Google Sign-In
- [ ] Recurring transactions

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using Firebase & Vanilla JavaScript
</p>
