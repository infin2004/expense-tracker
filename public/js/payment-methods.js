import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Default payment methods (empty - users add their own)
const DEFAULT_PAYMENT_METHODS = [];

/**
 * Loads payment methods for a user from Firestore
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of payment method strings
 */
export async function loadPaymentMethods(db, userId) {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.warn('[Payment Methods] User document not found');
            return DEFAULT_PAYMENT_METHODS;
        }

        const userData = userDoc.data();

        // If paymentMethods doesn't exist, initialize with defaults
        if (!userData.paymentMethods || userData.paymentMethods.length === 0) {
            await initializePaymentMethods(db, userId);
            return DEFAULT_PAYMENT_METHODS;
        }

        return userData.paymentMethods;
    } catch (error) {
        console.error('[Payment Methods] Error loading methods:', error);
        return DEFAULT_PAYMENT_METHODS;
    }
}

/**
 * Initializes payment methods for a user with defaults
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 */
async function initializePaymentMethods(db, userId) {
    try {
        const userDocRef = doc(db, 'users', userId);
        // Use set with merge to create document if it doesn't exist
        await setDoc(userDocRef, {
            paymentMethods: DEFAULT_PAYMENT_METHODS
        }, { merge: true });
        console.log('[Payment Methods] Initialized with defaults');
    } catch (error) {
        console.error('[Payment Methods] Error initializing methods:', error);
    }
}

/**
 * Adds a new payment method to user's list
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} method - Payment method name
 * @returns {Promise<boolean>} - Success status
 */
export async function addPaymentMethod(db, userId, method) {
    if (!method || method.trim().length === 0) {
        throw new Error('Payment method name cannot be empty');
    }

    const trimmedMethod = method.trim();

    // Check length (max 50 characters)
    if (trimmedMethod.length > 50) {
        throw new Error('Payment method name too long (max 50 characters)');
    }

    try {
        const userDocRef = doc(db, 'users', userId);

        // Check current count
        const userDoc = await getDoc(userDocRef);
        const currentMethods = userDoc.data()?.paymentMethods || [];

        if (currentMethods.length >= 20) {
            throw new Error('Maximum 20 payment methods allowed');
        }

        // Check for duplicates
        if (currentMethods.includes(trimmedMethod)) {
            throw new Error('Payment method already exists');
        }

        // Add using arrayUnion (atomic operation)
        await updateDoc(userDocRef, {
            paymentMethods: arrayUnion(trimmedMethod)
        });

        console.log('[Payment Methods] Added:', trimmedMethod);
        return true;
    } catch (error) {
        console.error('[Payment Methods] Error adding method:', error);
        throw error;
    }
}

/**
 * Removes a payment method from user's list
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} method - Payment method name
 * @returns {Promise<boolean>} - Success status
 */
export async function removePaymentMethod(db, userId, method) {
    try {
        const userDocRef = doc(db, 'users', userId);

        // Use arrayRemove (atomic operation)
        await updateDoc(userDocRef, {
            paymentMethods: arrayRemove(method)
        });

        console.log('[Payment Methods] Removed:', method);
        return true;
    } catch (error) {
        console.error('[Payment Methods] Error removing method:', error);
        throw error;
    }
}

/**
 * Refreshes the payment source dropdown in the transaction form
 * @param {Array} methods - Array of payment method strings
 */
export function refreshPaymentDropdown(methods) {
    const dropdown = document.getElementById('paymentSource');
    if (!dropdown) {
        console.warn('[Payment Methods] Dropdown not found');
        return;
    }

    // Store current selection
    const currentValue = dropdown.value;

    // Clear existing options
    dropdown.innerHTML = '';

    // If no payment methods, show placeholder
    if (methods.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No payment methods - Click Manage Methods to add';
        option.disabled = true;
        option.selected = true;
        dropdown.appendChild(option);
        dropdown.required = false; // Don't require selection when empty
        return;
    }

    // Add new options
    methods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        dropdown.appendChild(option);
    });

    // Restore selection if it still exists
    if (methods.includes(currentValue)) {
        dropdown.value = currentValue;
    }

    dropdown.required = true; // Re-enable required when methods exist
}

/**
 * Shows the payment methods management modal
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 */
export async function showPaymentMethodsModal(db, userId) {
    // Load current methods
    const methods = await loadPaymentMethods(db, userId);

    // Create modal HTML
    const modalHTML = `
        <div class="glass-modal-overlay" id="paymentMethodsModal">
            <div class="glass-card">
                <h2 style="margin-top: 0;">💳 Manage Payment Methods</h2>
                <p style="opacity: 0.9; margin-bottom: 1.5rem;">Add or remove custom payment sources</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <input 
                            type="text" 
                            id="newMethodInput" 
                            class="glass-input" 
                            placeholder="Enter payment method name"
                            maxlength="50"
                            style="flex: 1;"
                        />
                        <button id="addMethodBtn" class="btn-primary" style="padding: 0.8rem 1.5rem;">
                            ➕ Add
                        </button>
                    </div>
                    <small style="opacity: 0.7; display: block; margin-top: 0.5rem;">
                        Maximum 20 methods allowed
                    </small>
                </div>
                
                <div id="methodsList" class="methods-list">
                    ${renderMethodsList(methods)}
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button id="closeMethodsBtn" class="btn-secondary" style="flex: 1;">
                        Done
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Attach event listeners
    attachModalListeners(db, userId, methods);
}

/**
 * Renders the list of payment methods as chips
 * @param {Array} methods - Array of payment method strings
 * @returns {string} - HTML string
 */
function renderMethodsList(methods) {
    if (methods.length === 0) {
        return '<p style="opacity: 0.7; text-align: center;">No payment methods yet</p>';
    }

    return methods.map(method => `
        <div class="method-tag" data-method="${method}">
            <span>${method}</span>
            <button class="delete-method-btn" data-method="${method}" title="Remove">×</button>
        </div>
    `).join('');
}

/**
 * Attaches event listeners to modal elements
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {Array} currentMethods - Current methods array
 */
function attachModalListeners(db, userId, currentMethods) {
    let methods = [...currentMethods];

    // Add method button
    const addBtn = document.getElementById('addMethodBtn');
    const input = document.getElementById('newMethodInput');

    const handleAdd = async () => {
        const newMethod = input.value.trim();

        if (!newMethod) {
            showError('Please enter a payment method name');
            return;
        }

        try {
            await addPaymentMethod(db, userId, newMethod);
            methods.push(newMethod);

            // Refresh UI
            updateMethodsList(methods);
            refreshPaymentDropdown(methods);

            // Clear input
            input.value = '';
            input.focus();

            showSuccess('Payment method added!');
        } catch (error) {
            showError(error.message);
        }
    };

    addBtn.addEventListener('click', handleAdd);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    });

    // Delete method buttons (event delegation)
    const methodsList = document.getElementById('methodsList');
    methodsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-method-btn')) {
            const methodToRemove = e.target.dataset.method;

            if (confirm(`Remove "${methodToRemove}"?`)) {
                try {
                    await removePaymentMethod(db, userId, methodToRemove);
                    methods = methods.filter(m => m !== methodToRemove);

                    // Refresh UI
                    updateMethodsList(methods);
                    refreshPaymentDropdown(methods);

                    showSuccess('Payment method removed!');
                } catch (error) {
                    showError(error.message);
                }
            }
        }
    });

    // Close button
    document.getElementById('closeMethodsBtn').addEventListener('click', closeMethodsModal);

    // Close on overlay click
    document.getElementById('paymentMethodsModal').addEventListener('click', (e) => {
        if (e.target.id === 'paymentMethodsModal') {
            closeMethodsModal();
        }
    });
}

/**
 * Updates the methods list display
 * @param {Array} methods - Updated methods array
 */
function updateMethodsList(methods) {
    const methodsList = document.getElementById('methodsList');
    if (methodsList) {
        methodsList.innerHTML = renderMethodsList(methods);
    }
}

/**
 * Closes and removes the payment methods modal
 */
function closeMethodsModal() {
    const modal = document.getElementById('paymentMethodsModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Shows error message in modal
 * @param {string} message - Error message
 */
function showError(message) {
    const modal = document.getElementById('paymentMethodsModal');
    if (!modal) return;

    // Remove existing error
    const existingError = modal.querySelector('.error-message');
    if (existingError) existingError.remove();

    // Add new error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'background: rgba(255,0,0,0.2); color: #ff6b6b; padding: 0.75rem; border-radius: 8px; margin-top: 1rem; border: 1px solid rgba(255,0,0,0.3);';

    modal.querySelector('.glass-card').appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 3000);
}

/**
 * Shows success message in modal
 * @param {string} message - Success message
 */
function showSuccess(message) {
    const modal = document.getElementById('paymentMethodsModal');
    if (!modal) return;

    // Remove existing success
    const existingSuccess = modal.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();

    // Add new success
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = 'background: rgba(0,255,0,0.2); color: #51cf66; padding: 0.75rem; border-radius: 8px; margin-top: 1rem; border: 1px solid rgba(0,255,0,0.3);';

    modal.querySelector('.glass-card').appendChild(successDiv);

    setTimeout(() => successDiv.remove(), 2000);
}
