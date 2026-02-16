# 💰 Personal Expense Tracker

A secure, cloud-hosted expense tracking application built with Google Firebase and vanilla JavaScript.

## Features

✅ **Firebase Authentication** - Email/Password login
✅ **Income & Expense Tracking** - Negative values for income, positive for expenses
✅ **Real-time Dashboard** - Today, Weekly, and Monthly breakdowns
✅ **Spend Analysis** - Interactive Chart.js pie chart
✅ **Smart Filtering** - Filter by This Week, This Month, or All
✅ **Data Privacy** - Firestore security rules ensure user data isolation
✅ **Glassmorphism UI** - Modern, translucent design with gradient backgrounds

## Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Visualization**: Chart.js
- **SDK**: Firebase Modular Web SDK v9+

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Firebase CLI: `npm install -g firebase-tools`
- Google Firebase account

### Installation

1. **Clone/Navigate to project**
   ```bash
   cd "d:\Antigravity workspace\expense-tracker"
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init
   ```
   - Select: **Firestore** and **Hosting**
   - Create new project or use existing
   - Firestore rules: `firestore.rules`
   - Public directory: `public`
   - Single-page app: **Yes**

4. **Update Firebase Config**
   
   After initialization, get your config from Firebase Console:
   - Go to Project Settings → Your apps
   - Copy the `firebaseConfig` object
   - Update in `public/index.html` (lines ~141-147)

5. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy
   ```

## Usage

### Adding Transactions

- **Expense**: Enter positive amount (e.g., `100`)
- **Income**: Enter negative amount (e.g., `-500`)
- Amount **cannot be zero** (validation enforced)

### Payment Sources

- State Bank of India (SBI_BANK)
- IPPB (IPPB_BANK)
- SBI e-Rupee (SBI_ERUPEE)
- Cash (CASH)

### Filtering

- **This Month** - Default view
- **This Week** - Current ISO week
- **All** - Complete transaction history

### Monthly Breakdown

- **Net Total**: Sum of all transactions (income + expenses)
- **Spend** (Red): Total expenses (positive values only)
- **Received** (Green): Total income (absolute value of negative amounts)

### Spend Analysis Chart

- Displays **expenses only** (positive amounts)
- Grouped by category
- Income (negative values) is **excluded** from visualization

## Security

### Firestore Rules

Users can **only** access their own transaction data:

```javascript
match /users/{userId}/transactions/{transactionId} {
  allow read, write: if request.auth.uid == userId;
}
```

### XSS Protection

All user inputs (email, description, category) are sanitized using DOM text content to prevent script injection.

## Project Structure

```
expense-tracker/
├── public/
│   ├── css/
│   │   └── styles.css          # Glassmorphism design
│   ├── js/
│   │   ├── auth.js             # Authentication logic
│   │   └── dashboard.js        # Dashboard & transactions
│   └── index.html              # Main application
├── firestore.rules             # Database security rules
├── firebase.json               # Hosting configuration
└── README.md                   # This file
```

## Testing

### Test 1: Income Tracking
1. Add transaction: `-500` (Income)
2. Add transaction: `200` (Expense)
3. Check Monthly Breakdown:
   - **Spend**: ₹200.00 (red)
   - **Received**: ₹500.00 (green)

### Test 2: Pie Chart
- Verify chart shows **only expenses**
- Income should **not** appear in chart

### Test 3: Data Privacy
1. Create User A, add expense
2. Logout, create User B
3. Verify User B **cannot see** User A's data

## Live Demo

After deployment, your app will be available at:
```
https://<your-project-id>.web.app
```

## License

MIT License - Feel free to use for personal or commercial projects.

## Support

For issues or questions, refer to the [Firebase Documentation](https://firebase.google.com/docs).
