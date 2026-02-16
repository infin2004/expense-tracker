# Expense Tracker - Comprehensive Test Plan

## 🔧 **Fixes Applied (Feb 10, 2026)**

### Issues Identified & Fixed:
1. ✅ **Payment Methods Not Displaying** - Fixed hardcoded labels, now uses dynamic payment methods  
2. ✅ **Edit Modal Had Hardcoded Dropdown** - Now loads cached payment methods dynamically  
3. ✅ **Payment Methods Initialization** - Ensures defaults are loaded on dashboard init  
4. ✅ **XSS Protection** - Added `escapeHtml()` to edit modal inputs  

---

## 📋 **Test Cases**

### **Test Suite 1: Authentication & Initial Setup**

#### TC-1.1: New User Signup
**Steps:**
1. Navigate to https://expense-tracker-2026-787c9.web.app
2. Click "Sign Up" tab
3. Enter email: `test-[timestamp]@example.com`
4. Enter password: `Test123456`
5. Confirm password: `Test123456`
6. Click "Create Account"

**Expected Result:**
- ✅ Dashboard loads successfully
- ✅ Payment dropdown has 4 default options: Cash, SBI Bank, IPPB Bank, SBI e-Rupee
- ✅ User email displayed in header
- ✅ All summary cards show ₹0.00

#### TC-1.2: Existing User Login
**Steps:**
1. Navigate to app
2. Enter existing credentials
3. Click "Login"

**Expected Result:**
- ✅ Dashboard loads with previous data
- ✅ Payment methods persist from previous sessions
- ✅ Custom payment methods show in dropdown

---

###  **Test Suite 2: Payment Methods Management**

#### TC-2.1: View Default Payment Methods
**Steps:**
1. Login to dashboard
2. Scroll to "Add Transaction" form
3. Click payment source dropdown

**Expected Result:**
- ✅ Dropdown shows: Cash, SBI Bank, IPPB Bank, SBI e-Rupee

#### TC-2.2: Open Manage Methods Modal
**Steps:**
1. Click "⚙️ Manage Methods" button below payment dropdown

**Expected Result:**
- ✅ Modal opens with glassmorphism design
- ✅ Title: "💳 Manage Payment Methods"
- ✅ Input field and "➕ Add" button visible
- ✅ Methods list shows 4 default chips with × buttons
- ✅ "Done" button at bottom

#### TC-2.3: Add Custom Payment Method
**Steps:**
1. Open Manage Methods modal
2. Type "PayPal" in input field
3. Click "➕ Add" (or press Enter)

**Expected Result:**
- ✅ "PayPal" chip appears in methods list
- ✅ Green success message: "Payment method added!"
- ✅ Input field clears and focuses
- ✅ Payment dropdown in form now includes "PayPal"

#### TC-2.4: Add Payment Method - Validation Tests
**Steps & Expected Results:**

| Input | Expected Result |
|-------|----------------|
| *(empty)* | ❌ Error: "Please enter a payment method name" |
| "Cash" | ❌ Error: "Payment method already exists" |
| "A very long payment method name that exceeds fifty characters" | ❌ Error: "Payment method name too long (max 50 characters)" |
| *(Add 20th method when 19 exist)* | ✅ Success |
| *(Try to add 21st method)* | ❌ Error: "Maximum 20 payment methods allowed" |

#### TC-2.5: Delete Payment Method
**Steps:**
1. Open Manage Methods modal
2. Click × button on "PayPal" chip
3. Confirm deletion in browser alert

**Expected Result:**
- ✅ "PayPal" chip disappears
- ✅ Green success message: "Payment method removed!"
- ✅ Payment dropdown no longer shows "PayPal"
- ✅ Methods persist after page refresh

#### TC-2.6: Close Modal
**Steps:**
Test each method:
1. Click "Done" button
2. Click outside modal (overlay)
3. Refresh page and verify persistence

**Expected Result:**
- ✅ Modal closes
- ✅ Added methods remain in dropdown
- ✅ Changes saved to Firestore

---

### **Test Suite 3: Transaction Creation**

#### TC-3.1: Create Expense with Default Payment Method
**Steps:**
1. Amount: `50.00`
2. Category: `Food`
3. Payment Source: `Cash`
4. Date: Today
5. Description: `Lunch`
6. Click "Add Transaction"

**Expected Result:**
- ✅ Form resets
- ✅ Transaction appears in list (if "Show All" clicked)
- ✅ Payment source shows as "Cash"
- ✅ Summary cards update

#### TC-3.2: Create Expense with Custom Payment Method
**Steps:**
1. Add custom method "Credit Card"
2. Create transaction:
   - Amount: `100.00`
   - Category: `Shopping`
   - Payment Source: `Credit Card`
3. Submit

**Expected Result:**
- ✅ Transaction saves
- ✅ Payment source displays as "Credit Card" in transaction list

#### TC-3.3: Create Income Transaction
**Steps:**
1. Amount: `-500.00` (negative)
2. Category: `Salary`
3. Payment Source: `SBI Bank`
4. Submit

**Expected Result:**
- ✅ Transaction displays in green
- ✅ Monthly "Received" increases by ₹500.00
- ✅ Payment source shows correctly

#### TC-3.4: Validation Tests
**Steps & Expected Results:**

| Input | Expected Result |
|-------|----------------|
| Amount: `0` | ❌ Alert: "Amount cannot be zero..." |
| Category: *(empty)* | ❌ Alert: "Please enter a category" |
| Amount: *(not a number)* | ❌ Browser HTML5 validation |

---

### **Test Suite 4: Transaction Editing**

#### TC-4.1: Edit Transaction with Custom Payment Method
**Steps:**
1. Create transaction with "Cash"
2. Click "Edit" button
3. Change payment source to custom method (e.g., "PayPal")
4. Change amount to `75.00`
5. Click "Save"

**Expected Result:**
- ✅ Edit form shows dropdown with ALL payment methods (including custom)
- ✅ Can select custom payment method
- ✅ Transaction updates with new payment source
- ✅ Display shows "PayPal" correctly

#### TC-4.2: Edit Then Cancel
**Steps:**
1. Click "Edit"
2. Change values
3. Click "Cancel"

**Expected Result:**
- ✅ Transaction returns to display mode
- ✅ No changes saved

#### TC-4.3: XSS Protection Test
**Steps:**
1. Edit transaction
2. Category: `<script>alert('XSS')</script>`
3. Description: `<img src=x onerror=alert('XSS')>`
4. Save

**Expected Result:**
- ✅ Script tags displayed as plain text, NOT executed
- ✅ No alert shows
- ✅ Data sanitized in display

---

### **Test Suite 5: WhatsApp Weekly Reporting**

#### TC-5.1: First Time Report Check
**Steps:**
1. Clear browser localStorage
2. Add transactions for current week
3. Refresh page
4. Wait 2 seconds

**Expected Result:**
- ✅ Modal appears: "📊 Weekly Report Ready"
- ✅ Report preview shows current week's data
- ✅ Shows income, expense, net savings
- ✅ Top 3 categories listed with amounts

#### TC-5.2: Send via WhatsApp
**Steps:**
1. Report modal appears
2. Click "📱 Send via WhatsApp"

**Expected Result:**
- ✅ WhatsApp opens (web or app)
- ✅ Message pre-filled with formatted report
- ✅ Markdown formatting preserved
- ✅ User's `lastReportDate` updated in Firestore

#### TC-5.3: Click "Later"
**Steps:**
1. Report modal appears
2. Click "Later"

**Expected Result:**
- ✅ Modal closes
- ✅ localStorage sets `reportShownThisWeek = true`
- ✅ Refreshing page does NOT show modal again

#### TC-5.4: Weekly Reset Test
**Steps:**
1. Set `lastReportDate` in Firestore to last week
2. Clear localStorage
3. Refresh page

**Expected Result:**
- ✅ Modal appears (new week detected)
- ✅ ISO week calculation correct (Monday start)

#### TC-5.5: No Transactions Week
**Steps:**
1. Delete all transactions
2. Trigger report check

**Expected Result:**
- ✅ No modal appears (no transactions to report)
- ✅ Console log: "No transactions this week"

---

### **Test Suite 6: Filtering & Display**

#### TC-6.1: Filter Buttons
**Steps:**
Test each filter:
1. Click "This Month"
2. Click "This Week"
3. Click "All"

**Expected Result:**
- ✅ Active button highlighted
- ✅ Transaction list filters correctly
- ✅ Chart updates to match filter
- ✅ Summary cards update

#### TC-6.2: Show/Hide Transaction List
**Steps:**
1. Click "Show All"
2. Click "Hide List" (after opened)

**Expected Result:**
- ✅ List toggles visibility
- ✅ Button text changes

#### TC-6.3: Payment Method Display in List
**Steps:**
1. Create transactions with different payment methods
2. View transaction list

**Expected Result:**
- ✅ Each transaction shows correct payment method name
- ✅ Custom payment methods display properly
- ✅ No "undefined" or error values

---

### **Test Suite 7: Chart Functionality**

#### TC-7.1: Pie Chart with Mixed Transactions
**Steps:**
1. Add expenses in categories: Food (₹100), Transport (₹50), Shopping (₹75)
2. Add income: Salary (-₹500)
3. View chart

**Expected Result:**
- ✅ Chart shows ONLY expense categories (Food, Transport, Shopping)
- ✅ Income excluded from chart
- ✅ Correct proportions shown
- ✅ Legend displays with amounts on hover

#### TC-7.2: Empty Chart
**Steps:**
1. Delete all expense transactions (keep income only)

**Expected Result:**
- ✅ Chart shows "No expense data to display"
- ✅ No errors in console

---

### **Test Suite 8: UI/UX Consistency**

#### TC-8.1: Glassmorphism Design Check
**Visual Inspection:**
- ✅ All modals use glassmorphism (blurred background, translucent cards)
- ✅ Consistent border colors (white rgba)
- ✅ Smooth animations on modal open/close
- ✅ Chips have hover effects

#### TC-8.2: Responsive Layout
**Steps:**
1. Resize browser to mobile width (375px)
2. Test all features

**Expected Result:**
- ✅ Layout stacks vertically
- ✅ Modals fit screen
- ✅ Buttons remain accessible
- ✅ No horizontal scroll

#### TC-8.3: Button Styling
**Checks:**
- ✅ "Manage Methods" button matches theme
- ✅ Proper spacing below dropdown
- ✅ Hover effects work
- ✅ Button disabled states (if applicable)

---

### **Test Suite 9: Data Persistence**

#### TC-9.1: Firestore Sync
**Steps:**
1. Create custom payment method
2. Open browser DevTools → Application → IndexedDB/Firestore cache
3. Clear cache
4. Refresh page

**Expected Result:**
- ✅ Custom payment methods reload from Firestore
- ✅ No data loss

#### TC-9.2: Cross-Device Sync
**Steps:**
1. Login on Device A
2. Add custom payment method "Venmo"
3. Login on Device B with same account

**Expected Result:**
- ✅ "Venmo" appears in Device B dropdown

#### TC-9.3: Offline Behavior
**Steps:**
1. Disconnect internet
2. Try to add payment method

**Expected Result:**
- ✅ Error message shown
- ✅ App doesn't crash
- ✅ Reconnect → Operations queue and sync

---

### **Test Suite 10: Security & Rules**

#### TC-10.1: Firestore Rules - Payment Methods
**Test via Firebase Console or curl:**
```javascript
// Try to add 21st payment method
updateDoc(users/userId, {
  paymentMethods: [...20 methods, '21st method']
})
```

**Expected Result:**
- ❌ Firestore rejects: "Permission denied" (array size validation)

#### TC-10.2: Firestore Rules - Other User Data
**Steps:**
1. Login as User A
2. Try to access User B's payment methods (via console)

**Expected Result:**
- ❌ Permission denied

#### TC-10.3: XSS in Payment Method Names
**Steps:**
1. Add method: `<script>alert('XSS')</script>`
2. View in dropdown and transaction list

**Expected Result:**
- ✅ Script tags escaped
- ✅ No execution

---

## 🐛 **Known Issues & Limitations**

### Intentional Limitations:
1. **Maximum 20 payment methods** - Firestore rule enforced
2. **WhatsApp report manual trigger** - Can't auto-send (no push notifications)
3. **Edit modal** - Uses cached payment methods (may need refresh if managed in another tab)

### Edge Cases to Watch:
1. **Very long payment method names** - Max 50 chars enforced
2. **Special characters in payment names** - Should be escaped properly
3. **Rapid add/delete operations** - Firestore atomic operations handle this

### Not Tested (Browser Environment Issue):
- Live DOM interaction (browser tool failed)
- Visual regression testing
- Multi-tab sync behavior

---

## ✅ **Automated Test Checklist**

Use this for manual testing:

- [ ] Sign up new user
- [ ] Default payment methods appear
- [ ] Open Manage Methods modal
- [ ] Add custom payment method
- [ ] Delete payment method
- [ ] Create transaction with custom method
- [ ] Edit transaction, change payment method
- [ ] Verify payment method displays correctly in list
- [ ] Test WhatsApp report modal (if new week)
- [ ] Test all filter buttons
- [ ] Test chart with mixed transactions
- [ ] Test XSS protection (categories & descriptions)
- [ ] Test responsive layout (mobile width)
- [ ] Logout and login → Verify persistence
- [ ] Test Firestore rule (try 21st method via DevTools)

---

## 📱 **Manual Testing Guidance**

### How to Test Locally:
1. Open https://expense-tracker-2026-787c9.web.app
2. Open Browser DevTools (F12)
3. Console tab → Watch for errors
4. Network tab → Check Firestore requests
5. Application tab → Check localStorage

### How to Trigger WeeklyReport (Without Waiting for Monday):
```javascript
// In browser console:
localStorage.removeItem('lastReportCheck');
localStorage.removeItem('reportShownThisWeek');
location.reload();
```

### How to Inspect Firestore Data:
1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{your-uid}`
3. Verify `paymentMethods` array
4. Check `lastReportDate` timestamp

---

## 🚀 **Deployment Verification**

**Latest Deploy**: Feb 10, 2026, 23:24 IST  
**Files Updated**: `dashboard.js`, `payment-methods.js`, `form-init.js`  
**Hosting URL**: https://expense-tracker-2026-787c9.web.app  

**Post-Deploy Checklist:**
- [x] Hosting deploy successful
- [x] No console errors on load
- [x] Payment methods load correctly
- [x] Manage modal opens
- [x] Transactions save with custom methods
- [ ] User verification pending (manual test required)

---

## 📊 **Test Summary Report Template**

**Tester**: _____________  
**Date**: _____________  
**Browser/Device**: _____________  

| Test Suite | Pass | Fail | Notes |
|------------|------|------|-------|
| Authentication | ☐ | ☐ | |
| Payment Methods | ☐ | ☐ | |
| Transactions | ☐ | ☐ | |
| Editing | ☐ | ☐ | |
| WhatsApp Report | ☐ | ☐ | |
| Filtering | ☐ | ☐ | |
| Chart | ☐ | ☐ | |
| UI/UX | ☐ | ☐ | |
| Security | ☐ | ☐ | |

**Critical Issues Found**: _____________  
**Recommendations**: _____________
