import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "../../stores/authStore";

const DEMO_CREDENTIALS = [
  { label: "Owner demo", email: "ava@example.com", password: "Password123!" },
  { label: "Collaborator demo", email: "ben@example.com", password: "Password123!" },
];

export function AuthPage() {
  const token = useAuthStore((state) => state.token);
  const mode = useAuthStore((state) => state.mode);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const setMode = useAuthStore((state) => state.setMode);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const title = useMemo(
    () => (mode === "login" ? "Sign in to your workspace" : "Create a reviewer-friendly account"),
    [mode],
  );

  if (token) {
    return <Navigate replace to="/documents" />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "login") {
      await login({ email, password });
      return;
    }
    await register({ name, email, password });
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <span className="badge">Assignment-ready scope</span>
        <h1>SyncScribe</h1>
        <h2 className="hero-title">Collaborative writing without the Google Docs sprawl.</h2>
        <p>
          SyncScribe is a lightweight collaborative editor for drafting, formatting, importing, and sharing documents
          with owners, editors, and viewers.
        </p>
        <div className="info-card">
          <h2>Seeded review accounts</h2>
          <ul className="demo-list">
            {DEMO_CREDENTIALS.map((entry) => (
              <li key={entry.email}>
                <strong>{entry.label}</strong>
                <span>{entry.email}</span>
                <span>{entry.password}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>
        <h2>{title}</h2>
        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          ) : null}
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
