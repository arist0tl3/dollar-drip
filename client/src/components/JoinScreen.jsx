import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

async function verifyToken(token) {
  const res = await fetch(`${API_URL}/api/auth/verify?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Verification failed');
  }
  return res.json();
}

export default function JoinScreen() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your link...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Missing token. Please request a new magic link.');
      return;
    }

    verifyToken(token)
      .then((data) => {
        const session = data.session;
        if (!session?.token || !session?.member?.id || !session?.household?.id) {
          throw new Error('Invalid session response');
        }

        localStorage.setItem('budgetSessionToken', session.token);
        localStorage.setItem('budgetCurrentUserId', session.member.id);
        localStorage.setItem('budgetHouseholdId', session.household.id);

        setStatus('success');
        setMessage('Signed in. Redirecting...');
        setTimeout(() => {
          window.location.href = '/app';
        }, 600);
      })
      .catch(() => {
        setStatus('error');
        setMessage('That link is invalid or expired. Request a new one.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-3">
          {status === 'error' ? 'Unable to join' : 'Joining...'}
        </h1>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  );
}
