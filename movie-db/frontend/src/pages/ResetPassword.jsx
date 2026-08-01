import { useState } from 'react';
import { api } from '../api.js';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const data = await api('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, new_password: password }),
      });
      setMessage(data.message);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-page">
      <h2>Reset password</h2>
      <p className="hint">DEV mode: the new password is applied immediately — no reset link is sent.</p>
      <form onSubmit={handleSubmit} className="card-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 6 characters"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Resetting…' : 'Reset password'}
        </button>
        {message && <div className="success-banner">✅ {message}</div>}
        {error && <div className="error-banner">⚠️ {error}</div>}
      </form>
    </div>
  );
}
