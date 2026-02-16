import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

import { doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// DOM Elements
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Auth state - will be set by onAuthStateChanged
let currentUser = null;

// ============================================
// TAB SWITCHING (Login ↔ Sign Up)
// ============================================
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    clearErrors();
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    clearErrors();
});

// ============================================
// SIGN UP HANDLER
// ============================================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = sanitizeInput(document.getElementById('signupEmail').value.trim());
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    // Validation
    if (password.length < 6) {
        showError(signupError, 'Password must be at least 6 characters');
        return;
    }

    if (password !== passwordConfirm) {
        showError(signupError, 'Passwords do not match');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);

        // Create user document in Firestore with EMPTY payment methods
        const userDocRef = doc(window.db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
            email: email,
            paymentMethods: [], // Start with empty array - user adds their own
            createdAt: Timestamp.now(),

            // Weekly Report fields (in-app only, no WhatsApp)
            weeklyReportOptIn: true,     // Default: user gets weekly reports (can opt-out)
            lastReportWeek: null,        // ISO week string (e.g. "2026-W07")
            lastReportShownAt: null      // Rate limiting timestamp
        });

        console.log('[Auth] User document created successfully');
        // onAuthStateChanged will handle the redirect
        signupForm.reset();
    } catch (error) {
        console.error('Signup error:', error);
        showError(signupError, getErrorMessage(error.code));
    }
});

// ============================================
// LOGIN HANDLER
// ============================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = sanitizeInput(document.getElementById('loginEmail').value.trim());
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(window.auth, email, password);
        // onAuthStateChanged will handle the redirect
        loginForm.reset();
    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, getErrorMessage(error.code));
    }
});

// ============================================
// LOGOUT HANDLER
// ============================================
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(window.auth);
        // onAuthStateChanged will handle the redirect
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
});

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(window.auth, (user) => {
    if (user) {
        // User is authenticated
        currentUser = user;
        userEmail.textContent = user.email;
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');

        // Initialize dashboard (dashboard.js will listen for this event)
        window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: { userId: user.uid } }));
    } else {
        // User is not authenticated
        currentUser = null;
        authView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sanitizeInput(input) {
    // XSS protection: remove HTML tags
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function showError(element, message) {
    element.textContent = message;
}

function clearErrors() {
    loginError.textContent = '';
    signupError.textContent = '';
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled',
        'auth/weak-password': 'Password is too weak',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'Invalid email or password',
        'auth/wrong-password': 'Invalid email or password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Export currentUser for use in dashboard.js
export { currentUser };
