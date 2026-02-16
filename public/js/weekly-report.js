import { doc, getDoc, updateDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getLastCompletedWeek, fetchWeekTransactions, generateReport, isNewWeekDue } from './report-service.js';

/**
 * In-App Weekly Report Module
 * 
 * Shows weekly financial summary in a modal on Monday login
 * No external sharing - view only
 */

/**
 * Main entry point - checks conditions and shows report if eligible
 * 
 * Conditions checked:
 * 1. User is authenticated
 * 2. User has opted in to weekly reports
 * 3. New ISO week has started
 * 4. Report not already shown this week
 * 5. At least 12 hours since last report shown (rate limiting)
 * 6. User has transactions in the last completed week
 * 
 * @param {Object} auth - Firebase Auth instance
 * @param {Object} db - Firestore instance
 */
export async function checkAndShowWeeklyReport(auth, db) {
    const user = auth.currentUser;

    if (!user) {
        console.log('[Weekly Report] User not authenticated');
        return;
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.log('[Weekly Report] User document not found');
            return;
        }

        const userData = userDoc.data();

        // Check if user opted out
        if (userData.weeklyReportOptIn === false) {
            console.log('[Weekly Report] User opted out of reports');
            return;
        }

        const lastCompleted = getLastCompletedWeek();
        const currentWeekString = lastCompleted.isoWeek;

        // Check if new week
        if (!isNewWeekDue(userData.lastReportWeek)) {
            console.log('[Weekly Report] Already shown for this week:', currentWeekString);
            return;
        }

        // Rate limiting (12 hours minimum)
        if (userData.lastReportShownAt) {
            const lastShown = userData.lastReportShownAt.toDate();
            const hoursSince = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60);

            if (hoursSince < 12) {
                console.log('[Weekly Report] Rate limited (shown < 12hrs ago)');
                return;
            }
        }

        // Fetch transactions for last completed week
        const { start, end } = lastCompleted;
        const transactions = await fetchWeekTransactions(db, user.uid, start, end);

        if (transactions.length === 0) {
            console.log('[Weekly Report] No transactions in last completed week');
            return;
        }

        // All conditions met - generate and show report
        console.log('[Weekly Report] All conditions met, showing report');

        const reportData = generateReport(transactions);

        if (reportData) {
            showReportModal(reportData, user.uid, db, currentWeekString);

            // Update rate limit timestamp
            await updateDoc(userDocRef, {
                lastReportShownAt: Timestamp.now()
            });
        }

    } catch (error) {
        console.error('[Weekly Report] Error checking report:', error);
    }
}

/**
 * Displays the weekly report modal (in-app only, no sharing)
 * 
 * @param {Object} reportData - Report from generateReport()
 * @param {string} userId - User ID
 * @param {Object} db - Firestore instance
 * @param {string} weekString - ISO week string (e.g. "2026-W07")
 */
function showReportModal(reportData, userId, db, weekString) {
    const { weekRange, totalIncome, totalExpense, netSavings, topCategories, transactionCount, insight } = reportData;

    // Format dates
    const startDate = weekRange.start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const endDate = weekRange.end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    // Build top categories HTML
    let categoriesHTML = '';
    if (topCategories && topCategories.length > 0) {
        categoriesHTML = '<div style="margin-top: 1rem;"><strong>Top Spending:</strong><ul style="margin: 0.5rem 0; padding-left: 1.5rem;">';
        topCategories.forEach(({ category, amount }) => {
            categoriesHTML += `<li>${category}: ₹${amount.toFixed(2)}</li>`;
        });
        categoriesHTML += '</ul></div>';
    }

    // Create modal HTML with higher z-index and no overlay close
    const modalHTML = `
        <div class="glass-modal-overlay" id="weeklyReportModal" style="z-index: 10000; backdrop-filter: blur(8px);">
            <div class="glass-card" style="max-width: 500px; position: relative; z-index: 10001;" onclick="event.stopPropagation();">
                <h2 style="margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                    📊 Your Weekly Summary
                </h2>
                <p style="opacity: 0.8; margin-bottom: 1.5rem; font-size: 0.95rem;">
                    ${startDate} – ${endDate}
                </p>
                
                <div style="background: rgba(0,0,0,0.15); padding: 1.25rem; border-radius: 12px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="opacity: 0.9;">Income:</span>
                        <strong style="color: #4ade80;">₹${totalIncome.toFixed(2)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="opacity: 0.9;">Expenses:</span>
                        <strong style="color: #f87171;">₹${totalExpense.toFixed(2)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <span style="opacity: 0.9;">Net Savings:</span>
                        <strong style="color: ${netSavings >= 0 ? '#60a5fa' : '#f87171'}; font-size: 1.1rem;">₹${netSavings.toFixed(2)}</strong>
                    </div>
                </div>
                
                ${categoriesHTML}
                
                ${insight ? `<div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.15); border-radius: 8px; display: flex; align-items: center; gap: 0.5rem;">
                    <span>💡</span>
                    <em style="opacity: 0.9; font-size: 0.9rem;">${insight}</em>
                </div>` : ''}
                
                <p style="opacity: 0.7; font-size: 0.85rem; margin-top: 1rem; text-align: center;">
                    ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} recorded
                </p>
                
                <div style="margin-top: 1.5rem;">
                    <button id="closeReportBtn" class="btn-primary" style="width: 100%; padding: 0.75rem;">
                        Got it
                    </button>
                </div>
                
                <div style="margin-top: 1rem; opacity: 0.7; font-size: 0.85rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; justify-content: center;">
                        <input type="checkbox" id="optOutCheckbox" style="cursor: pointer;">
                        Don't show weekly reports anymore
                    </label>
                </div>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listeners
    document.getElementById('closeReportBtn').addEventListener('click', async () => {
        await handleCloseReport(userId, db, weekString);
    });

    document.getElementById('optOutCheckbox').addEventListener('change', async (e) => {
        if (e.target.checked) {
            await handleOptOut(userId, db);
        }
    });

    // NO OVERLAY CLICK - Only button closes modal
}

/**
 * Handles "Got it" button click
 * Marks this week as viewed
 * 
 * @param {string} userId - User ID
 * @param {Object} db - Firestore instance
 * @param {string} weekString - ISO week string
 */
async function handleCloseReport(userId, db, weekString) {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            lastReportWeek: weekString,
            lastReportShownAt: Timestamp.now()
        });

        console.log('[Weekly Report] Report acknowledged, state updated');
    } catch (error) {
        console.error('[Weekly Report] Error updating state:', error);
    }

    closeReportModal();
}

/**
 * Handles opt-out checkbox
 * Disables future weekly reports
 * 
 * @param {string} userId - User ID
 * @param {Object} db - Firestore instance
 */
async function handleOptOut(userId, db) {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            weeklyReportOptIn: false
        });

        console.log('[Weekly Report] User opted out of reports');
        alert('Weekly reports disabled. You can re-enable them in settings.');

        closeReportModal();
    } catch (error) {
        console.error('[Weekly Report] Error opting out:', error);
    }
}

/**
 * Closes and removes the report modal
 */
function closeReportModal() {
    const modal = document.getElementById('weeklyReportModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * TESTING FUNCTION: Manually trigger weekly report
 * 
 * @param {Object} auth - Firebase Auth instance
 * @param {Object} db - Firestore instance
 */
export async function testWeeklyReport(auth, db) {
    const user = auth.currentUser;
    if (!user) {
        console.error('[Test] User not logged in');
        alert('Please login first');
        return;
    }

    try {
        console.log('[Test] Fetching transactions for last completed week...');

        const lastCompleted = getLastCompletedWeek();
        const transactions = await fetchWeekTransactions(db, user.uid, lastCompleted.start, lastCompleted.end);

        console.log(`[Test] Found ${transactions.length} transactions`);

        const reportData = generateReport(transactions);

        if (reportData) {
            console.log('[Test] Report generated successfully:', reportData);
            showReportModal(reportData, user.uid, db, lastCompleted.isoWeek);
        } else {
            console.log('[Test] No transactions to generate report');
            alert('No transactions found in last completed week. Add some transactions and try again!');
        }
    } catch (error) {
        console.error('[Test] Error generating test report:', error);
        alert('Error generating test report. Check console for details.');
    }
}

// Expose test function to window for console access
if (typeof window !== 'undefined') {
    window.testWeeklyReport = async () => {
        const { testWeeklyReport } = await import('./weekly-report.js');
        testWeeklyReport(window.auth, window.db);
    };
}
