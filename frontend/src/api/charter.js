import client from './client';

/**
 * POST /auth/login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string}>}
 */
export const login = async (username, password) => {
  const { data } = await client.post('/auth/login', { username, password });
  if (data.access_token) sessionStorage.setItem('puhar_token', data.access_token);
  return data;
};

/**
 * POST /advisor/recommend
 * Full charter advisor pipeline
 */
export const advise = async (payload) => {
  const { data } = await client.post('/advisor/recommend', payload);
  return data;
};

export const logout = () => sessionStorage.removeItem('puhar_token');
export const getToken = () => sessionStorage.getItem('puhar_token');
export const isAuthenticated = () => !!getToken();
