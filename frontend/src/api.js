const BASE_URL = 'http://localhost:4000/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const token = getToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { method, headers };
  if (body) config.body = isFormData ? body : JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchFileBlobUrl(endpoint) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Failed to load file preview');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}