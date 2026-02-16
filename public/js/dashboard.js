import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Import Weekly Report (In-App View Only)
import { checkAndShowWeeklyReport } from './weekly-report.js';
// Import Payment Methods
import { loadPaymentMethods } from './payment-methods.js';
// Import PDF Export Service
import { exportTransactionsToPDF } from './pdf-service.js';

// Global state
let userId = null;
let allTransactions = [];
let currentFilter = 'month';
let spendChart = null;
let userEmail = '';

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionItems = document.getElementById('transactionItems');
const transactionList = document.getElementById('transactionList');
const noTransactions = document.getElementById('noTransactions');
const toggleListBtn = document.getElementById('toggleListBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Summary card elements
const todayAmount = document.getElementById('todayAmount');
const weeklyAmount = document.getElementById('weeklyAmount');
const monthlyTotal = document.getElementById('monthlyTotal');
const monthlySpend = document.getElementById('monthlySpend');
const monthlyReceived = document.getElementById('monthlyReceived');

// Filter buttons
const filterButtons = document.querySelectorAll('.filter-btn');

// Cache for payment methods
let cachedPaymentMethods = [];

// ============================================
// USER AUTHENTICATION EVENT
// ============================================
window.addEventListener('userAuthenticated', (event) => {
    userId = event.detail.userId;
    userEmail = event.detail.email; // Capture email for PDF
    initializeDashboard();

    // Setup Export Button
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            // Show loading state
            const originalText = exportPdfBtn.innerHTML;
            exportPdfBtn.innerHTML = '⏳ Generating...';
            exportPdfBtn.disabled = true;

            // Small delay to allow UI update
            setTimeout(() => {
                // Filter transactions to match current view
                const transactionsToExport = filterByDate(allTransactions, currentFilter);

                exportTransactionsToPDF(transactionsToExport, currentFilter, { email: userEmail })
                    .then(() => {
                        exportPdfBtn.innerHTML = originalText;
                        exportPdfBtn.disabled = false;
                        showToast('PDF Exported', 'Statement downloaded successfully', 'income');
                    })
                    .catch(err => {
                        console.error(err);
                        exportPdfBtn.innerHTML = originalText;
                        exportPdfBtn.disabled = false;
                        alert('Failed to generate PDF');
                    });
            }, 100);
        });
    }
});

// ============================================
// INITIALIZE DASHBOARD
// ============================================
function initializeDashboard() {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Set up Firestore real-time listener
    const transactionsRef = collection(window.db, `users/${userId}/transactions`);
    const q = query(transactionsRef, orderBy('date', 'desc'));

    onSnapshot(q, (snapshot) => {
        allTransactions = [];
        snapshot.forEach((doc) => {
            allTransactions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        updateDashboard();
    });

    // Load payment methods into cache
    loadPaymentMethods(window.db, userId).then(methods => {
        cachedPaymentMethods = methods;
    });

    // CHECK FOR WEEKLY REPORT (In-App Display)
    setTimeout(() => {
        checkAndShowWeeklyReport(window.auth, window.db);
    }, 2000); // Delay 2s to let dashboard load first
}

// ============================================
// ADD TRANSACTION
// ============================================
// Toggle Category based on Type
const transactionType = document.getElementById('transactionType');
const categoryGroup = document.getElementById('categoryGroup');
const categoryInput = document.getElementById('category');

transactionType.addEventListener('change', (e) => {
    if (e.target.value === 'income') {
        categoryGroup.style.display = 'none';
        categoryInput.required = false;
    } else {
        categoryGroup.style.display = 'block';
        categoryInput.required = true;
    }
});

// ============================================
// ADD TRANSACTION
// ============================================
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('transactionType').value;
    let amount = parseFloat(document.getElementById('amount').value);
    let category = categoryInput.value.trim();
    const paymentSource = document.getElementById('paymentSource').value;
    const dateInput = document.getElementById('date').value;
    const description = sanitizeInput(document.getElementById('description').value.trim());

    // START VALIDATION
    if (amount === 0) {
        alert('Amount cannot be zero.');
        return;
    }

    // Handle Income vs Expense
    if (type === 'income') {
        amount = -Math.abs(amount); // Ensure negative for income
        category = 'Income';        // Default category
    } else {
        amount = Math.abs(amount);  // Ensure positive for expense
        if (!category) {
            alert('Please enter a category');
            return;
        }
        category = sanitizeInput(category);
    }

    try {
        // Convert date string to Firestore Timestamp
        const dateObj = new Date(dateInput);

        await addDoc(collection(window.db, `users/${userId}/transactions`), {
            amount,
            category,
            payment_source: paymentSource,
            date: Timestamp.fromDate(dateObj),
            description,
            createdAt: Timestamp.now()
        });

        // Reset form
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date();

        // Reset UI state (Back to Expense default)
        categoryGroup.style.display = 'block';
        categoryInput.required = true;

        // Show Success Toast
        showToast(
            amount < 0 ? 'Income Added' : 'Expense Added',
            `₹${Math.abs(amount).toFixed(2)} added successfully`,
            amount < 0 ? 'income' : 'expense'
        );

    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction. Please try again.');
    }
});

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(title, message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    // Icon handling
    const icon = type === 'income' ? '💰' : '💸';

    // Create toast HTML
    const toastHTML = `
        <div class="toast-notification ${type}">
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${message}</span>
            </div>
        </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', toastHTML);

    // Trigger animation with a small delay to ensure DOM update
    const toast = document.querySelector('.toast-notification');
    console.log('Showing toast:', title);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for transition
    }, 3000);
}

// ============================================
// UPDATE DASHBOARD
// ============================================
function updateDashboard() {
    updateSummaryCards();
    updateTransactionList();
    updateSpendChart();
}

// ============================================
// SUMMARY CARDS CALCULATIONS
// ============================================
function updateSummaryCards() {
    const now = new Date();
    const todayTransactions = filterByDate(allTransactions, 'today', now);
    const weekTransactions = filterByDate(allTransactions, 'week', now);
    const monthTransactions = filterByDate(allTransactions, 'month', now);

    // Today
    const todaySum = calculateNetTotal(todayTransactions);
    todayAmount.textContent = formatCurrency(todaySum);
    updateValueColor(todayAmount, todaySum);

    // Weekly
    const weeklySum = calculateNetTotal(weekTransactions);
    weeklyAmount.textContent = formatCurrency(weeklySum);
    updateValueColor(weeklyAmount, weeklySum);

    // Monthly Breakdown
    const monthlySum = calculateNetTotal(monthTransactions);
    const monthlySpendValue = calculateSpend(monthTransactions);
    const monthlyReceivedValue = calculateReceived(monthTransactions);

    monthlyTotal.textContent = formatCurrency(monthlySum);
    updateValueColor(monthlyTotal, monthlySum);
    monthlySpend.textContent = formatCurrency(monthlySpendValue);
    monthlyReceived.textContent = formatCurrency(monthlyReceivedValue);
}

// Helper to colorize values (Income stored as negative, so negative sum = surplus)
function updateValueColor(element, amount) {
    element.classList.remove('value-positive', 'value-negative');
    if (amount < 0) {
        element.classList.add('value-positive'); // Surplus (Income > Expenses)
    } else if (amount > 0) {
        element.classList.add('value-negative'); // Deficit (Expenses > Income)
    }
    // Zero remains neutral color
}

function calculateNetTotal(transactions) {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function calculateSpend(transactions) {
    // Sum of all POSITIVE amounts (expenses)
    return transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
}

function calculateReceived(transactions) {
    // Absolute sum of all NEGATIVE amounts (income)
    return Math.abs(transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0));
}

// ============================================
// FILTER BY DATE
// ============================================
function filterByDate(transactions, period, referenceDate = new Date()) {
    return transactions.filter(tx => {
        const txDate = tx.date.toDate();

        switch (period) {
            case 'today':
                return isSameDay(txDate, referenceDate);

            case 'week':
                return isSameWeek(txDate, referenceDate);

            case 'month':
                return isSameMonth(txDate, referenceDate);

            case 'all':
            default:
                return true;
        }
    });
}

function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function isSameWeek(date1, date2) {
    const weekStart = getWeekStart(date2);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return date1 >= weekStart && date1 < weekEnd;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    return new Date(d.setDate(diff));
}

function isSameMonth(date1, date2) {
    return date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// ============================================
// TRANSACTION LIST
// ============================================
function updateTransactionList() {
    const filteredTransactions = filterByDate(allTransactions, currentFilter);

    if (filteredTransactions.length === 0) {
        transactionItems.innerHTML = '';
        noTransactions.style.display = 'block';
        return;
    }

    noTransactions.style.display = 'none';

    transactionItems.innerHTML = filteredTransactions.map(tx => `
        <div class="transaction-item" data-id="${tx.id}">
            <div class="amount ${tx.amount > 0 ? 'positive' : 'negative'}">
                ${formatCurrency(tx.amount)}
            </div>
            <div class="details">
                <div class="category">${escapeHtml(tx.category)}</div>
                <div class="description">${escapeHtml(tx.description || '')}</div>
                <div class="meta">
                    ${escapeHtml(tx.payment_source || 'N/A')} • ${formatDate(tx.date.toDate())}
                </div>
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="editTransaction('${tx.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteTransaction('${tx.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// EDIT TRANSACTION
// ============================================
window.editTransaction = function (txId) {
    const tx = allTransactions.find(t => t.id === txId);
    if (!tx) return;

    const item = document.querySelector(`[data-id="${txId}"]`);
    const dateStr = formatDateInput(tx.date.toDate());

    // Generate payment method options dynamically
    const paymentOptions = cachedPaymentMethods.map(method =>
        `<option value="${escapeHtml(method)}" ${tx.payment_source === method ? 'selected' : ''}>${escapeHtml(method)}</option>`
    ).join('');

    item.innerHTML = `
        <div class="edit-form">
            <input type="number" step="0.01" id="edit-amount-${txId}" class="glass-input" value="${tx.amount}" placeholder="Amount">
            <input type="text" id="edit-category-${txId}" class="glass-input" value="${escapeHtml(tx.category)}" placeholder="Category">
            
            <select id="edit-payment-${txId}" class="glass-input">
                ${paymentOptions}
            </select>
            <input type="date" id="edit-date-${txId}" class="glass-input" value="${dateStr}">
            
            <input type="text" id="edit-description-${txId}" class="glass-input full-width" value="${escapeHtml(tx.description || '')}" placeholder="Description">
            
            <div class="actions">
                <button class="btn-save" onclick="saveTransaction('${txId}')">Save Changes</button>
                <button class="btn-cancel" onclick="updateDashboard()">Cancel</button>
            </div>
        </div>
    `;
};

window.saveTransaction = async function (txId) {
    const amount = parseFloat(document.getElementById(`edit-amount-${txId}`).value);
    const category = sanitizeInput(document.getElementById(`edit-category-${txId}`).value.trim());
    const paymentSource = document.getElementById(`edit-payment-${txId}`).value;
    const dateInput = document.getElementById(`edit-date-${txId}`).value;
    const description = sanitizeInput(document.getElementById(`edit-description-${txId}`).value.trim());

    // Validation
    if (amount === 0) {
        alert('Amount cannot be zero');
        return;
    }

    if (!category) {
        alert('Category is required');
        return;
    }

    try {
        const dateObj = new Date(dateInput);

        await updateDoc(doc(window.db, `users/${userId}/transactions`, txId), {
            amount,
            category,
            payment_source: paymentSource,
            date: Timestamp.fromDate(dateObj),
            description
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Failed to update transaction');
    }
};

// ============================================
// DELETE TRANSACTION
// ============================================
window.deleteTransaction = async function (txId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    try {
        await deleteDoc(doc(window.db, `users/${userId}/transactions`, txId));
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
    }
};

// ============================================
// FILTER BUTTONS
// ============================================
filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        updateDashboard();
    });
});

// ============================================
// TOGGLE TRANSACTION LIST
// ============================================
toggleListBtn.addEventListener('click', () => {
    const isHidden = transactionList.classList.contains('hidden');
    transactionList.classList.toggle('hidden');
    toggleListBtn.textContent = isHidden ? 'Hide List' : 'Show All';
});

// ============================================
// SPEND ANALYSIS CHART (Chart.js)
// ============================================
function updateSpendChart() {
    const filteredTransactions = filterByDate(allTransactions, currentFilter);

    // Aggregate POSITIVE amounts only (expenses) by category
    const categoryTotals = {};
    filteredTransactions
        .filter(tx => tx.amount > 0) // CRITICAL: Exclude negative values (income)
        .forEach(tx => {
            if (!categoryTotals[tx.category]) {
                categoryTotals[tx.category] = 0;
            }
            categoryTotals[tx.category] += tx.amount;
        });

    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);

    // Chart colors (glassmorphism theme)
    const colors = [
        'rgba(102, 126, 234, 0.7)',
        'rgba(118, 75, 162, 0.7)',
        'rgba(240, 147, 251, 0.7)',
        'rgba(245, 87, 108, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(236, 72, 153, 0.7)'
    ];

    const ctx = document.getElementById('spendChart').getContext('2d');

    // Destroy existing chart
    if (spendChart) {
        spendChart.destroy();
    }

    // Create new chart
    if (categories.length > 0) {
        spendChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: totals,
                    backgroundColor: colors.slice(0, categories.length),
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: { size: 12 },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ₹' + context.parsed.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } else {
        // No expense data
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    return '₹' + Math.abs(amount).toFixed(2);
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}
