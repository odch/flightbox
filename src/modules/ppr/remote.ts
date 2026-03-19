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

export async function loadRequests(token: string) {
  const res = await fetch(`${baseUrl()}/ppr/requests`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load PPR requests: ${res.status}`);
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
