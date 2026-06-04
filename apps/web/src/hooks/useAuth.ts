import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import { toast } from "sonner";

export function useAuth() {
  const { user, accessToken, setUser, setToken, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setToken(data.accessToken);
    navigate("/dashboard");
    toast.success(`Welcome back, ${data.user.name}!`);
  }, [setUser, setToken, navigate]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await authApi.signup(name, email, password);
    setUser(data.user);
    setToken(data.accessToken);
    navigate("/dashboard");
    toast.success("Account created successfully!");
  }, [setUser, setToken, navigate]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    storeLogout();
    navigate("/");
    toast.success("Signed out successfully");
  }, [storeLogout, navigate]);

  return { user, accessToken, login, signup, logout, isAuthenticated: !!user };
}
