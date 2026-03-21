export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'x-auth-token': token } : {};
};