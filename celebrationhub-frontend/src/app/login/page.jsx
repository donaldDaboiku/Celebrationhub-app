'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { isAuthenticated, login } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(form.email, form.password);
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Welcome back"
            title="Sign in to CelebrationHub"
            subtitle="Use your organization email and password to manage members, templates, campaigns, and settings."
            footer="Need a new workspace? Use Register. Forgot your access details? Use Reset access."
        >
            {error ? <div className="error-box">{error}</div> : null}

            <form onSubmit={handleSubmit} className="auth-form">
                <label className="field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="admin@yourchurch.com"
                        required
                        autoComplete="email"
                    />
                </label>

                <label className="field">
                    <span>Password</span>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                    />
                </label>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <style jsx>{`
                .auth-form { display: grid; gap: 18px; }
                .field { display: grid; gap: 8px; }
                .field span { color: #334155; font-size: 13px; font-weight: 700; }
                input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1px solid #dbe4f0;
                    border-radius: 16px;
                    font-size: 15px;
                    outline: none;
                }
                input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.1); }
                .submit-btn {
                    width: 100%;
                    border: none;
                    border-radius: 999px;
                    padding: 14px 18px;
                    background: linear-gradient(135deg, #1d4ed8, #f97316);
                    color: #fff;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .submit-btn:disabled { opacity: .65; cursor: not-allowed; }
                .error-box {
                    margin-bottom: 18px;
                    background: #fef2f2;
                    color: #b91c1c;
                    border: 1px solid #fecaca;
                    border-radius: 16px;
                    padding: 12px 14px;
                    font-size: 14px;
                }
            `}</style>
        </AuthShell>
    );
}
