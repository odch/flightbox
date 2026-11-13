declare var __FIREBASE_PROJECT_ID__: string;

const baseUrl = () =>
  `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api`;

export async function submitRequest(data: unknown, token: string) {
  const res = await fetch(`${baseUrl()}/ppr/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// 'own': the requests of the logged-in user; 'all': every request (admins)
export type PprListScope = 'own' | 'all';

export async function loadRequests(token: string, scope: PprListScope = 'own') {
  const res = await fetch(`${baseUrl()}/ppr/requests${scope === 'all' ? '/all' : ''}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load PPR requests: ${res.status}`);
  }
  return res.json();
}

export interface PprSettings {
  adminEmail: string | null;
  retentionDays: number | null;
  answerMode: 'manual' | 'automatic';
  pilotInfo: string | null;
  closures: { from: string; to: string; reason: string }[];
}

export async function loadSettings(token: string): Promise<PprSettings> {
  const res = await fetch(`${baseUrl()}/ppr/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load PPR settings: ${res.status}`);
  }
  return res.json();
}

// Saves only the given settings; returns all of them
export async function saveSettings(settings: Partial<PprSettings>, token: string): Promise<PprSettings> {
  const res = await fetch(`${baseUrl()}/ppr/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function reviewRequest(key: string, status: string, remarks: string | undefined, token: string) {
  const res = await fetch(`${baseUrl()}/ppr/requests/${encodeURIComponent(key)}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status, remarks }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Admins revoke an approval with a reason; the pilot is told by email
export async function revokeApproval(key: string, remarks: string, token: string) {
  const res = await fetch(`${baseUrl()}/ppr/requests/${encodeURIComponent(key)}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteRequest(key: string, token: string) {
  const res = await fetch(`${baseUrl()}/ppr/requests/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
