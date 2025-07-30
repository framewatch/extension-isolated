export const errorDictionary = {
    // Firebase Auth Errors
    'auth/invalid-email': 'The email address is not valid. Please try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/requires-recent-login': 'For your security, please log in again to continue.',
    'auth/too-many-requests': 'You have tried to sign in too many times. Please wait a moment or reset your password.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',

    // Firebase Functions Errors
    'functions/permission-denied': 'Your current plan does not permit this action. Please upgrade.',
    'functions/internal': 'The server encountered an internal error. Please try again later.',
    'functions/unavailable': 'The service is currently unavailable. Please try again later.',
    'functions/already-exists': 'This vinted account is already connected to other e-mail',
    'functions/unauthenticated': 'Authentication required to start a trial.',
    'functions/already-exists-trial': 'You have already had a free trial',


    // User Input & Validation Errors
    'all-fields-required': 'All fields are required. Please fill them out.',
    'enter-username-or-keyword': 'Please enter username or keyword',
    'specify-quantity': 'Please specify the quantity',
    'message-cannot-be-empty': 'The message cannot be empty.',
    'no-item-selected': 'Please select at least one item to continue.',
    'vinted-profile-required': 'Please navigate to your Vinted profile page first.',
    'vinted-username-not-found': 'Could not find a Vinted username in the current page URL.',
    'email-not-verified': 'Email not verified yet. Please check your inbox and try again.',

    // Generic & Network Errors
    'firebase-not-initialized': 'The application could not connect to our services. Please try again.',
    'generic-error': 'An unexpected error occurred. Please try again later.',
};

/**
 * Retrieves a user-friendly error message from the dictionary.
 * @param {string} errorCode - The error code from Firebase or the application.
 * @returns {string} The friendly error message.
 */
export function getFriendlyErrorMessage(errorCode) {
    return errorDictionary[errorCode] || errorDictionary['generic-error'];
}