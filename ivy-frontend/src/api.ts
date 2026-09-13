export const API_BASE = 'https://solve.ivy.homes';
export const API_KEY = import.meta.env.VITE_API_KEY || '';

let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');
export let userEmail = localStorage.getItem('user_email');

export const setTokens = (access: string, refresh: string, email?: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  if (email) {
    userEmail = email;
    localStorage.setItem('user_email', email);
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  userEmail = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
};

export const isAuthenticated = () => !!accessToken;

const refreshAccessToken = async () => {
  if (!refreshToken) throw new Error('No refresh token');
  
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!response.ok) {
    clearTokens();
    throw new Error('Session expired');
  }

  const data = await response.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!accessToken) throw new Error('Not authenticated');

  const headers = {
    'X-API-Key': API_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } catch (error) {
      window.dispatchEvent(new Event('auth:expired'));
      throw error;
    }
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const buildQuery = (params: Record<string, any>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value.toString());
    }
  });
  return query.toString();
};

export const getSavedListings = async () => {
  return apiFetch('/v1/saved');
};

export const saveListing = async (listingId: string) => {
  return apiFetch('/v1/saved', {
    method: 'POST',
    body: JSON.stringify({ listing_id: listingId })
  });
};

export const removeSavedListing = async (listingId: string) => {
  return apiFetch(`/v1/saved/${listingId}`, {
    method: 'DELETE'
  });
};

export const getMe = async () => {
  return apiFetch('/v1/me');
};

