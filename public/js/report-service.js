import { collection, query, where, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Gets the Monday of the week for a given date (ISO week starts on Monday)
 * @param {Date} date 
 * @returns {Date} - Monday at 00:00:00
 */
function getMonday(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

/**
 * Gets the last COMPLETED ISO week range
 * Never includes current week - only full weeks
 * 
 * Example: If today is Monday Feb 10, this returns Feb 3-9 (last week)
 * 
 * @returns {Object} - {start: Date, end: Date, isoWeek: string}
 */
export function getLastCompletedWeek() {
    const now = new Date();
    const currentMonday = getMonday(now);

    // Go back one week to get last completed week
    const lastWeekMonday = new Date(currentMonday);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);

    const lastWeekSunday = new Date(lastWeekMonday);
    lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
    lastWeekSunday.setHours(23, 59, 59, 999);

    return {
        start: lastWeekMonday,
        end: lastWeekSunday,
        isoWeek: getISOWeekString(lastWeekMonday)
    };
}

/**
 * Converts date to ISO 8601 week string
 * 
 * @param {Date} date 
 * @returns {string} - Format: "2026-W07"
 */
export function getISOWeekString(date) {
    // ISO 8601 week date calculation
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    const year = target.getFullYear();
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Fetches transactions for a specific week range
 * 
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {Date} weekStart - Start of week
 * @param {Date} weekEnd - End of week
 * @returns {Promise<Array>} - Array of transaction objects
 */
export async function fetchWeekTransactions(db, userId, weekStart, weekEnd) {
    try {
        const transactionsRef = collection(db, `users/${userId}/transactions`);

        const weekQuery = query(
            transactionsRef,
            where('date', '>=', Timestamp.fromDate(weekStart)),
            where('date', '<=', Timestamp.fromDate(weekEnd))
        );

        const snapshot = await getDocs(weekQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('[Report Service] Error fetching transactions:', error);
        return [];
    }
}

/**
 * Sanitizes category name to prevent XSS and injection
 * 
 * @param {string} category - Raw category name
 * @returns {string} - Sanitized category
 */
function sanitizeCategory(category) {
    if (!category || typeof category !== 'string') {
        return 'Other';
    }

    // Remove potentially harmful characters
    return category
        .replace(/[<>\"\']/g, '')        // Remove HTML/script chars
        .replace(/\n/g, ' ')              // Replace newlines with space
        .replace(/https?:\/\//gi, '')     // Remove URLs
        .slice(0, 30)                     // Max 30 chars
        .trim() || 'Other';
}

/**
 * Generates insight message based on financial performance
 * 
 * @param {number} income - Total income
 * @param {number} expense - Total expense
 * @returns {string} - Insight message
 */
function generateInsight(income, expense) {
    if (income === 0 && expense === 0) {
        return "Start tracking to get insights!";
    }

    const savingsRate = income > 0 ? ((income - expense) / income * 100) : 0;

    if (savingsRate >= 50) {
        return "Great job saving over 50%!";
    } else if (savingsRate >= 30) {
        return "Good savings rate this week";
    } else if (savingsRate >= 10) {
        return "Try to save a bit more next week";
    } else if (savingsRate < 0) {
        return "Expenses exceeded income - review your budget";
    } else {
        return "Keep tracking consistently!";
    }
}

/**
 * Generates structured report from transactions
 * Pure business logic - no formatting
 * 
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object|null} - Structured report data or null if no transactions
 */
export function generateReport(transactions) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount);

        if (isNaN(amount)) return; // Skip invalid amounts

        if (amount < 0) {
            // Negative = Income
            totalIncome += Math.abs(amount);
        } else {
            // Positive = Expense
            totalExpense += amount;

            // Sanitize and aggregate by category
            const category = sanitizeCategory(tx.category);
            categoryExpenses[category] = (categoryExpenses[category] || 0) + amount;
        }
    });

    // Get top 3 expense categories
    const topCategories = Object.entries(categoryExpenses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount }));

    const netSavings = totalIncome - totalExpense;
    const weekRange = getLastCompletedWeek();

    return {
        weekRange,
        totalIncome,
        totalExpense,
        netSavings,
        topCategories,
        transactionCount: transactions.length,
        insight: generateInsight(totalIncome, totalExpense)
    };
}

/**
 * Checks if a new report is due based on ISO week comparison
 * 
 * @param {string|null} lastReportWeek - ISO week string from Firestore (e.g. "2026-W07")
 * @returns {boolean} - True if a new week has started
 */
export function isNewWeekDue(lastReportWeek) {
    if (!lastReportWeek) return true; // First run ever

    const lastCompleted = getLastCompletedWeek();
    const currentWeekString = lastCompleted.isoWeek;

    return currentWeekString !== lastReportWeek;
}
