const API_BASE = '/api';

export async function createShare(content) {
  const res = await fetch(`${API_BASE}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong.', res.status);
  }

  return data;
}

export async function retrieveShare(code) {
  const res = await fetch(`${API_BASE}/shares/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong.', res.status);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
