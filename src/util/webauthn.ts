import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { getIdToken } from './firebase';

export interface PasskeySummary {
  credentialId: string;
  deviceName: string;
  createdAt: number;
}

function endpoint(name: string): string {
  return `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/${name}`;
}

async function post(
  name: string,
  body: unknown,
  authHeader?: string,
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  const response = await fetch(endpoint(name), {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });
  if (!response.ok) {
    let message = `Request to ${name} failed`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        message = errorData.error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  return response.json();
}

export async function registerPasskey(): Promise<PasskeySummary> {
  const idToken = await getIdToken();
  const authHeader = `Bearer ${idToken}`;

  const { options, challengeKey } = await post(
    'generateWebauthnRegistrationOptions',
    {},
    authHeader,
  );

  const attestationResponse = await startRegistration({ optionsJSON: options });

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const result = await post(
    'verifyWebauthnRegistration',
    { challengeKey, attestationResponse, userAgent },
    authHeader,
  );

  return {
    credentialId: result.credentialId,
    deviceName: result.deviceName,
    createdAt: result.createdAt,
  };
}

export async function authenticateWithPasskey(email?: string): Promise<string> {
  const requestBody = email ? { email } : {};

  const { options, challengeKey } = await post(
    'generateWebauthnAuthenticationOptions',
    requestBody,
  );

  const assertionResponse = await startAuthentication({ optionsJSON: options });

  const result = await post(
    'verifyWebauthnAuthentication',
    { challengeKey, assertionResponse },
  );

  if (!result || typeof result.token !== 'string') {
    throw new Error('Passkey verification did not return a token');
  }
  return result.token;
}

export async function removePasskey(credentialId: string): Promise<void> {
  const idToken = await getIdToken();
  const authHeader = `Bearer ${idToken}`;
  await post('removeWebauthnCredential', { credentialId }, authHeader);
}

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined'
    && typeof (window as any).PublicKeyCredential !== 'undefined';
}
