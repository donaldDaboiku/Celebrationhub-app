'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, isAuthenticated } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm]       = useState({ email: '', password: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) router.replace('/dashboard');
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        <div className="login-page">
            <div className="login-card">
                <h1>CelebrationHub</h1>
                <p className="subtitle">Sign in to your organization</p>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            placeholder="admin@yourchurch.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 24px;
                }

                .login-card {
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }

                h1 {
                    font-family: Georgia, serif;
                    font-size: 28px;
                    margin-bottom: 8px;
                    text-align: center;
                }

                .subtitle {
                    color: #666;
                    text-align: center;
                    margin-bottom: 32px;
                    font-size: 15px;
                }

                .error-box {
                    background: #fee2e2;
                    color: #dc2626;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    font-size: 14px;
                }

                .field {
                    margin-bottom: 20px;
                }

                label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 6px;
                    color: #374151;
                }

                input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 15px;
                    transition: border-color 0.2s;
                    outline: none;
                    box-sizing: border-box;
                }

                input:focus {
                    border-color: #4f46e5;
                }

                .submit-btn {
                    width: 100%;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 8px;
                }

                .submit-btn:hover:not(:disabled) {
                    background: #4338ca;
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
