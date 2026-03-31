import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

let currentCognitoUser = null;
let pendingChallengeType = null;

/**
 * Register a new user with Cognito.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export function signUp(name, email, password) {
  const attributeList = [
    new CognitoUserAttribute({ Name: 'name', Value: name }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Confirm a new user's account with the OTP sent to their email.
 * @param {string} email
 * @param {string} code
 * @returns {Promise}
 */
export function confirmSignUp(email, code) {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Resend the confirmation code to the user's email.
 * @param {string} email
 * @returns {Promise}
 */
export function resendConfirmationCode(email) {
  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Sign in an existing user.
 * Stores the IdToken and user name in localStorage on success.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} Resolves with the IdToken string
 */
export function signIn(email, password) {
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        currentCognitoUser = cognitoUser;
        pendingChallengeType = null;
        const idToken = session.getIdToken().getJwtToken();
        localStorage.setItem('shehealth_token', idToken);

        // Store the user's name from the token payload
        const payload = session.getIdToken().decodePayload();
        if (payload.name) {
          localStorage.setItem('shehealth_user_name', payload.name);
        }

        resolve({ status: 'SUCCESS', token: idToken });
      },
      mfaRequired(challengeName) {
        currentCognitoUser = cognitoUser;
        pendingChallengeType = 'MFA';
        resolve({ status: 'MFA_REQUIRED', challengeName });
      },
      totpRequired(challengeName) {
        currentCognitoUser = cognitoUser;
        pendingChallengeType = 'MFA';
        resolve({ status: 'MFA_REQUIRED', challengeName });
      },
      customChallenge() {
        currentCognitoUser = cognitoUser;
        pendingChallengeType = 'CUSTOM_CHALLENGE';
        resolve({ status: 'MFA_REQUIRED', challengeName: 'CUSTOM_CHALLENGE' });
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

/**
 * Complete sign-in with an OTP when Cognito requests MFA.
 * @param {string} code
 * @param {string} challengeName
 * @returns {Promise<{ status: string, token: string }>}
 */
export function verifySignInOtp(code, challengeName = 'SMS_MFA') {
  if (!currentCognitoUser) {
    return Promise.reject(new Error('No active login session found. Please try logging in again.'));
  }

  const challengeType = pendingChallengeType || (challengeName === 'CUSTOM_CHALLENGE' ? 'CUSTOM_CHALLENGE' : 'MFA');

  return new Promise((resolve, reject) => {
    const callbacks = {
      onSuccess(session) {
        pendingChallengeType = null;
        const idToken = session.getIdToken().getJwtToken();
        localStorage.setItem('shehealth_token', idToken);

        const payload = session.getIdToken().decodePayload();
        if (payload.name) {
          localStorage.setItem('shehealth_user_name', payload.name);
        }

        resolve({ status: 'SUCCESS', token: idToken });
      },
      onFailure(err) {
        reject(err);
      },
    };

    if (challengeType === 'CUSTOM_CHALLENGE') {
      currentCognitoUser.sendCustomChallengeAnswer(code, callbacks);
      return;
    }

    currentCognitoUser.sendMFACode(code, callbacks, challengeName);
  });
}

/**
 * Sign out the current user and clear the stored token.
 */
export function signOut() {
  if (currentCognitoUser) {
    currentCognitoUser.signOut();
    currentCognitoUser = null;
  }
  pendingChallengeType = null;
  localStorage.removeItem('shehealth_token');
  localStorage.removeItem('shehealth_user_name');
}

/**
 * Retrieve the stored IdToken from localStorage.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem('shehealth_token') || null;
}

/**
 * Decode the current JWT and return basic user info.
 * @returns {{ name: string, sub: string, email: string }|null}
 */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT is three base64url segments separated by dots; the payload is the middle one
    const payloadBase64 = token.split('.')[1];
    // Convert base64url to standard base64
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      name: payload.name || null,
      sub: payload.sub || null,
      email: payload.email || null,
    };
  } catch {
    return null;
  }
}
