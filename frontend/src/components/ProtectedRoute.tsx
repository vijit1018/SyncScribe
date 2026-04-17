import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    if (token) {
      void hydrateUser();
    }
  }, [hydrateUser, token]);

  return token ? <Outlet /> : <Navigate replace to="/auth" />;
}
