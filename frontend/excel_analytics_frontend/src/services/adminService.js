import authService from './authService';

const API_URL = 'http://localhost:5000/api/admin';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authService.getAccessToken()}`,
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
};

const getStats = async () => {
  const response = await fetch(`${API_URL}/stats`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

const getUsers = async (search = '') => {
  const response = await fetch(`${API_URL}/users?search=${search}`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

const getActivity = async () => {
  const response = await fetch(`${API_URL}/activity`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

const addUser = async (userData) => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

const deleteUser = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const adminService = {
  getStats,
  getUsers,
  addUser,
  deleteUser,
  getActivity
};
