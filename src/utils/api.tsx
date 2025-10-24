import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a9845035`;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Health check
export const healthCheck = async () => {
  return fetchWithAuth(`${BASE_URL}/health`);
};

// Auth
export const signup = async (email: string, password: string, name: string) => {
  return fetchWithAuth(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
};

// Offices
export const createOffice = async (name: string, officeName: string) => {
  return fetchWithAuth(`${BASE_URL}/offices`, {
    method: 'POST',
    body: JSON.stringify({ name, officeName }),
  });
};

export const joinOffice = async (officeCode: string, name: string) => {
  return fetchWithAuth(`${BASE_URL}/offices/join`, {
    method: 'POST',
    body: JSON.stringify({ officeCode, name }),
  });
};

export const getUserOffices = async () => {
  return fetchWithAuth(`${BASE_URL}/offices`);
};

export const getOfficeData = async (officeId: string) => {
  return fetchWithAuth(`${BASE_URL}/offices/${officeId}`);
};

export const updateEmployee = async (employeeId: string, updates: any) => {
  return fetchWithAuth(`${BASE_URL}/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Clock in/out
export const clockIn = async (employeeId: string, officeId: string) => {
  return fetchWithAuth(`${BASE_URL}/clock/in`, {
    method: 'POST',
    body: JSON.stringify({ employeeId, officeId }),
  });
};

export const clockOut = async (employeeId: string, officeId: string) => {
  return fetchWithAuth(`${BASE_URL}/clock/out`, {
    method: 'POST',
    body: JSON.stringify({ employeeId, officeId }),
  });
};

export const getClockStatus = async (employeeId: string) => {
  return fetchWithAuth(`${BASE_URL}/clock/status/${employeeId}`);
};

export const getClockHistory = async (officeId: string) => {
  return fetchWithAuth(`${BASE_URL}/clock/history/${officeId}`);
};

// Generic data operations
export const createData = async (officeId: string, type: string, data: any) => {
  return fetchWithAuth(`${BASE_URL}/data/${officeId}/${type}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getData = async (officeId: string, type: string) => {
  return fetchWithAuth(`${BASE_URL}/data/${officeId}/${type}`);
};

export const updateData = async (officeId: string, type: string, data: any) => {
  return fetchWithAuth(`${BASE_URL}/data/${officeId}/${type}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};