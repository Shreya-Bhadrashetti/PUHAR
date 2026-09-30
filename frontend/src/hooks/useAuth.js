import { useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, isAuthenticated } from '../api/charter';

export function useAuth() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      await apiLogin(username, password);
      setAuthed(true);
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setAuthed(false);
  }, []);

  return { authed, login, logout, loading, error };
}
