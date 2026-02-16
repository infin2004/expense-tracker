import { loadPaymentMethods, refreshPaymentDropdown, showPaymentMethodsModal } from './payment-methods.js';

// Initialize payment methods on page load
let currentUser = null;

// Listen for user authentication
window.addEventListener('userAuthenticated', async (event) => {
    currentUser = event.detail.userId;
    await initializePaymentMethods();
});

/**
 * Initializes the payment methods dropdown and manager button
 */
async function initializePaymentMethods() {
    if (!currentUser) return;

    try {
        // Load payment methods from Firestore
        const methods = await loadPaymentMethods(window.db, currentUser);

        // Populate dropdown
        refreshPaymentDropdown(methods);

        // Attach event listener to manage button
        const manageBtn = document.getElementById('manageMethodsBtn');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                showPaymentMethodsModal(window.db, currentUser);
            });
        }
    } catch (error) {
        console.error('[Form] Error initializing payment methods:', error);
    }
}
