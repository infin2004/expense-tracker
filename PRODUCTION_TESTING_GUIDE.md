# Production-Grade WhatsApp Reporter - Testing Guide

## 🎯 Overview

This guide helps you verify that the production-grade WhatsApp reporter works correctly and safely.

**Deployed**: Feb 11, 2026  
**URL**: https://expense-tracker-2026-787c9.web.app

---

## 🧪 Testing Scenarios

### ✅ Test 1: New User Signup

**Purpose**: Verify new fields are initialized correctly

**Steps**:
1. Sign out if logged in
2. Create a new test account
3. Open browser console (F12 → Console)
4. Run: `testWhatsAppReport()`

**Expected**:
- ✅ "No transactions found" message
- ✅ No errors in console
- ✅ New user starts with `reportOptIn: true`

---

### ✅ Test 2: Test Function (Manual Trigger)

**Purpose**: Test the report modal and formatting

**Steps**:
1. Login to your account
2. Add some transactions (different categories, amounts)
3. Open console (F12)
4. Run: `testWhatsAppReport()`

**Expected**:
- ✅ Modal appears with report preview
- ✅ Shows income, expense, net savings
- ✅ Top 3 categories displayed
- ✅ Currency formatted as ₹X.XX
- ✅ "Send via WhatsApp" button present
- ✅ "Later" button present
- ✅ "Don't show weekly reports anymore" checkbox

**Check formatting**:
- ✅ Bold headers (`*text*` in preview)
- ✅ Italic dates (`_text_`)
- ✅ Table aligned properly
- ✅ No HTML/script tags visible
- ✅ Categories truncated if too long

---

### ✅ Test 3: WhatsApp Opening

**Purpose**: Verify safe WhatsApp opening

**Steps**:
1. Run `testWhatsAppReport()`
2. Click "Send via WhatsApp"

**Expected**:
- ✅ WhatsApp opens in new tab
- ✅ Message is pre-filled
- ✅ URL starts with `https://api.whatsapp.com/send?text=`
- ✅ Message is URL-encoded
- ✅ Formatting preserved (bold, italics, tables)
- ✅ No errors in console
- ✅ Modal closes after opening WhatsApp

---

### ✅ Test 4: "Later" Button

**Purpose**: Verify modal closes without action

**Steps**:
1. Run `testWhatsAppReport()`
2. Click "Later"

**Expected**:
- ✅ Modal closes
- ✅ WhatsApp does NOT open
- ✅ No Firestore update to `lastReportWeek`
- ✅ Report can be shown again

---

### ✅ Test 5: Opt-Out Checkbox

**Purpose**: Verify opt-out functionality

**Steps**:
1. Run `testWhatsAppReport()`
2. Check "Don't show weekly reports anymore"

**Expected**:
- ✅ Alert appears: "Weekly reports disabled..."
- ✅ Modal closes
- ✅ Firestore updated: `reportOptIn: false`
- ✅ Future logins won't trigger report

**To re-enable** (manual):
```javascript
// In console:
firebase.firestore().doc(`users/${firebase.auth().currentUser.uid}`)
  .update({ reportOptIn: true });
```

---

### ✅ Test 6: Rate Limiting

**Purpose**: Verify 12-hour rate limit

**Steps**:
1. Run `testWhatsAppReport()` and close modal
2. Reload page
3. Run again immediately

**Current behavior**:
- ⚠️ Modal may show again (test function bypasses rate limit)

**Production behavior**:
- ✅ Auto-check at login will respect 12-hour limit
- ✅ Check console for: `[WhatsApp Reporter] Rate limited`

---

### ✅ Test 7: ISO Week Detection

**Purpose**: Verify correct week calculation

**Steps**:
1. Open console
2. Run:
```javascript
import('./js/report-service.js').then(m => {
  console.log(m.getLastCompletedWeek());
  console.log(m.getISOWeekString(new Date()));
});
```

**Expected**:
- ✅ `isoWeek` format: `"2026-W07"` (year-week)
- ✅ `start` is last week's Monday at 00:00
- ✅ `end` is last week's Sunday at 23:59
- ✅ Current week NOT included

---

### ✅ Test 8: XSS Protection

**Purpose**: Verify sanitization prevents injection

**Steps**:
1. Add transaction with category: `<script>alert('XSS')</script>`
2. Run `testWhatsAppReport()`

**Expected**:
- ✅ Category shown as `scriptalertXSS` (tags removed)
- ✅ No alert popup
- ✅ No script execution

**Additional test**:
1. Add category: `Food\n\nhttps://phishing.com\n\nTest`
2. Run `testWhatsAppReport()`

**Expected**:
- ✅ URL removed from category
- ✅ Newlines converted to spaces
- ✅ Final text: `Food Test` or similar

---

### ✅ Test 9: Long Category Names

**Purpose**: Verify truncation works

**Steps**:
1. Add transaction with 50-character category name
2. Run `testWhatsAppReport()`

**Expected**:
- ✅ Category truncated to 30 chars
- ✅ Table still aligns properly
- ✅ No layout breaks

---

### ✅ Test 10: No Transactions (Edge Case)

**Purpose**: Verify graceful handling

**Steps**:
1. Delete all transactions
2. Run `testWhatsAppReport()`

**Expected**:
- ✅ Alert: "No transactions found in last completed week"
- ✅ No modal shown
- ✅ No errors

---

### ✅ Test 11: Cross-Device Sync

**Purpose**: Verify Firestore state syncs

**Steps**:
1. Login on Device A (e.g., desktop Chrome)
2. Run `testWhatsAppReport()` and click "Send"
3. Login on Device B (e.g., mobile browser)
4. Check if report shows again

**Expected**:
- ✅ Report does NOT show on Device B (same week)
- ✅ Firestore `lastReportWeek` synced
- ✅ No duplicate prompts

---

### ✅ Test 12: Page Reload (Idempotency)

**Purpose**: Verify no duplicate on reload

**Steps**:
1. Clear all Firestore user fields manually
2. Login and wait for auto-check (2 seconds)
3. **Don't** interact with modal
4. Press F5 (reload)

**Expected**:
- ✅ Report shows on first load
- ✅ After reload, check console
- ✅ Should log: `[WhatsApp Reporter] Rate limited` or `Already shown`
- ✅ No second modal

---

## 🔒 Security Checklist

During testing, verify:

- [ ] No auto-open WhatsApp (manual click required)
- [ ] No auto-redirect
- [ ] window.open uses `noopener,noreferrer`
- [ ] All user input sanitized (categories, descriptions)
- [ ] XSS attempts blocked
- [ ] URL injection prevented
- [ ] Message length \u003c 4000 chars
- [ ] No phone numbers collected
- [ ] No auth tokens in URLs
- [ ] Firestore rules enforce field types

---

## 📊 Firestore Verification

**Check user document** (in Firebase Console):

```javascript
{
  email: string,
  paymentMethods: array,
  createdAt: timestamp,
  
  // WhatsApp Reporter fields
  reportOptIn: true,              // ✅ Boolean
  lastReportWeek: "2026-W07",     // ✅ ISO format or null
  reportPreviewShown: false,      // ✅ Boolean
  lastReportShownAt: timestamp    // ✅ Timestamp or null
}
```

**Firestore Rules Test**:

Try invalid data (should FAIL):
```javascript
// Invalid ISO week format
firebase.firestore().doc(`users/${uid}`)
  .update({ lastReportWeek: "invalid" }); // ❌ Should fail

// Invalid type
firebase.firestore().doc(`users/${uid}`)
  .update({ reportOptIn: "yes" }); // ❌ Should fail (not boolean)
```

Valid data (should SUCCEED):
```javascript
firebase.firestore().doc(`users/${uid}`)
  .update({ 
    lastReportWeek: "2026-W08",
    reportOptIn: false
  }); // ✅ Should succeed
```

---

## 🚀 Production Readiness Checklist

Before marking as production-ready:

### Core Functionality
- [ ] Test function works
- [ ] Modal displays correctly
- [ ] WhatsApp opens safely
- [ ] Opt-out checkbox works
- [ ] Rate limiting enforced
- [ ] ISO week calculation correct

### Security
- [ ] XSS protection verified
- [ ] URL injection blocked
- [ ] Safe window opening
- [ ] Firestore rules enforced
- [ ] No sensitive data in URLs

### User Experience
- [ ] Report format readable
- [ ] Currency formatting correct
- [ ] Categories sorted by amount
- [ ] "Later" button closes modal
- [ ] Opt-out persists across sessions

### Data Integrity
- [ ] Firestore updates atomic
- [ ] Cross-device sync works
- [ ] No duplicates on reload
- [ ] New users initialized properly
- [ ] Existing users unaffected

### Performance
- [ ] Dashboard loads within 2s
- [ ] Report check doesn't block UI
- [ ] No excessive Firestore reads
- [ ] Console clean (no errors)

---

## 🐛 Common Issues & Fixes

### Issue: "User not logged in"
**Fix**: Login first, then run `testWhatsAppReport()`

### Issue: "No transactions this week"
**Fix**: Add transactions for TODAY or this week, not last week

### Issue: Modal doesn't appear
**Fix**: 
- Hard refresh (Ctrl+Shift+R)
- Check console for errors
- Verify imports loaded

### Issue: WhatsApp message poorly formatted
**Fix**: This is normal - WhatsApp Web shows raw markdown. On mobile app, formatting renders properly.

### Issue: Opt-out doesn't work
**Fix**: 
- Check Firestore console
- Verify `reportOptIn` field updated
- Clear cache and retry

---

## 📝 Test Results Template

```markdown
# WhatsApp Reporter Test Results

**Date**: Feb 11, 2026  
**Tester**: [Your Name]  
**Environment**: Chrome/Firefox/Safari on Desktop/Mobile

## Results

| Test | Status | Notes |
|------|--------|-------|
| New User Signup | ✅/❌ | |
| Test Function | ✅/❌ | |
| WhatsApp Opening | ✅/❌ | |
| Later Button | ✅/❌ | |
| Opt-Out | ✅/❌ | |
| Rate Limiting | ✅/❌ | |
| ISO Week | ✅/❌ | Calculated: 2026-WXX |
| XSS Protection | ✅/❌ | |
| Long Categories | ✅/❌ | |
| No Transactions | ✅/❌ | |
| Cross-Device | ✅/❌ | |
| Page Reload | ✅/❌ | |

## Security Verification

- [ ] No auto-open
- [ ] XSS blocked
- [ ] Safe window.open
- [ ] Firestore rules work

## Production Ready?

☐ YES / ☐ NO

**Action Items**: [List any fixes needed]
```

---

## 🔄 Monitoring Post-Deployment

After initial verification:

1. **Monitor Firestore Usage**
   - Weekly reports shouldn't spike reads
   - Check for failed rule violations

2. **Check Console Logs**
   - Look for `[WhatsApp Reporter]` messages
   - Verify conditions working

3. **User Feedback**
   - Ask if reports received
   - Check opt-out rate
   - Verify message formatting on mobile

4. **URL Reputation**
   - Re-scan on VirusTotal weekly
   - Monitor for phishing complaints

---

**Ready to test?** Run `testWhatsAppReport()` in console and work through the checklist! 🚀
