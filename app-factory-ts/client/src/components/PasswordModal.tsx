import { useState } from 'react';
import { setPassword } from '../api';

interface Props {
  onUnlock: () => void;
}

export function PasswordModal({ onUnlock }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Verify against server
    try {
      setPassword(value);
      const res = await fetch('/health', {
        headers: { 'X-Password': value },
      });
      if (res.ok) {
        onUnlock();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch {
      setError('Could not connect to server');
      setPassword('');
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-icon">🔒</div>
        <h2>Access Required</h2>
        <p>Enter the access password to use App Factory.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary">Unlock</button>
        </form>
      </div>
    </div>
  );
}
