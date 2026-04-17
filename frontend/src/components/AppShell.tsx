import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";

export function AppShell() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <Link className="brand" to="/documents">
            SyncScribe
          </Link>
          <p className="topbar-subtitle">
            Collaborative writing with role-based sharing, import, and rich text editing.
          </p>
        </div>
        <div className="topbar-actions">
          <span className="user-chip">{user?.name}</span>
          {location.pathname !== "/documents" ? (
            <Link className="secondary-button" to="/documents">
              Back to dashboard
            </Link>
          ) : null}
          <button className="secondary-button" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
