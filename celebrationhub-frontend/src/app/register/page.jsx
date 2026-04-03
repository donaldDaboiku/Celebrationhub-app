'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { isAuthenticated, register } from '@/lib/api';

const initialForm = {
    organization_name: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
};

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState(initialForm);
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

        if (form.password !== form.password_confirmation) {
            setError('Password confirmation does not match.');
            return;
        }

        setLoading(true);

        try {
            await register({
                organization_name: form.organization_name,
                name: form.name,
                email: form.email,
                password: form.password,
            });
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please review the details and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="New workspace"
            title="Create your organization account"
            subtitle="Register your organization, create the admin account, and land directly in the dashboard."
            footer="The admin email becomes your sign-in email. You can reset access later if you need to update the account name or password."
        >
            {error ? <div className="error-box">{error}</div> : null}

            <form onSubmit={handleSubmit} className="auth-form">
                <label className="field">
                    <span>Organization name</span>
                    <input
                        value={form.organization_name}
                        onChange={(event) => setForm({ ...form, organization_name: event.target.value })}
                        placeholder="Celebration Assembly"
                        required
                    />
                </label>

                <label className="field">
                    <span>Admin name</span>
                    <input
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Pastor Ada"
                        required
                    />
                </label>

                <label className="field">
                    <span>Admin email</span>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="admin@yourorg.org"
                        required
                        autoComplete="email"
                    />
                </label>

                <div className="split">
                    <label className="field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            placeholder="At least 8 characters"
                            required
                            autoComplete="new-password"
                        />
                    </label>

                    <label className="field">
                        <span>Confirm password</span>
                        <input
                            type="password"
                            value={form.password_confirmation}
                            onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
                            placeholder="Repeat password"
                            required
                            autoComplete="new-password"
                        />
                    </label>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
            </form>

            <style jsx>{`
                .auth-form { display: grid; gap: 18px; }
                .field { display: grid; gap: 8px; }
                .field span { color: #334155; font-size: 13px; font-weight: 700; }
                .split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
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
                @media (max-width: 640px) {
                    .split { grid-template-columns: 1fr; }
                }
            `}</style>
        </AuthShell>
    );
}
