import { useRef, useState } from 'react';

interface LoginOverlayProps {
  onLogin: (username: string, password: string) => string | null;
}

export function LoginOverlay({ onLogin }: LoginOverlayProps) {
  const [error, setError] = useState('');
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = userRef.current?.value.trim() ?? '';
    const password = passRef.current?.value ?? '';
    const err = onLogin(username, password);
    if (err) {
      setError(err);
    } else {
      setError('');
    }
    if (passRef.current) passRef.current.value = '';
  }

  return (
    <div className="auth-overlay" id="loginOverlay">
      <form className="auth-card" id="loginForm" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <span className="mark" />
          <span className="nm">Conduit</span>
        </div>
        <h2>Sign in</h2>
        <label>
          Username
          <input id="loginUser" ref={userRef} autoComplete="username" />
        </label>
        <label>
          Password
          <input id="loginPass" ref={passRef} type="password" autoComplete="current-password" />
        </label>
        <div className="auth-err" id="loginErr">
          {error}
        </div>
        <button className="btn primary" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
