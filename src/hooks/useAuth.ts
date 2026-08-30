import { useCallback, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  getStoredToken,
  login as apiLogin,
  register as apiRegister,
  setStoredToken,
  toErrorMessage,
} from "../api/client";
import type { AuthCredentials, User } from "../types/auth";

interface UseAuthResult {
  user: User | null;
  initializing: boolean;
  submitting: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, if a token is already stored (e.g. from a previous session),
  // verify it's still valid and hydrate the user rather than trusting it blindly.
  useEffect(() => {
    if (!getStoredToken()) {
      setInitializing(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setStoredToken(null))
      .finally(() => setInitializing(false));
  }, []);

  // A 401 from any API call (e.g. an expired token mid-session) forces us
  // back to a logged-out state.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("taskpilot:unauthorized", onUnauthorized);
    return () => window.removeEventListener("taskpilot:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiLogin(credentials);
      setStoredToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const register = useCallback(async (credentials: AuthCredentials) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRegister(credentials);
      setStoredToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, initializing, submitting, error, login, register, logout, clearError };
}
