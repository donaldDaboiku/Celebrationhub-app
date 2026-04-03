'use client';

import { useEffect, useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { requestAccessReset, resetAccess } from '@/lib/api';

export default function ResetAccessPage() {
    const [requestForm, setRequestForm] = useState({ email: '' });
    const [resetForm, setResetForm] = useState({
        email: '',
        token: '',
        name: '',
        password: '',
        password_confirmation: '',
    });
    const [requestState, setRequestState] = useState({ loading: false, message: '', error: '' });
    const [resetState, setResetState] = useState({ loading: false, message: '', error: '' });

    useEffect(() => {
        const email = new URLSearchParams(window.location.search).get('email') || '';

        if (!email) {
            return undefined;
        }

        const frame = window.requestAnimationFrame(() => {
            setRequestForm({ email });
            setResetForm((current) => ({ ...current, email }));
        });

        return () => window.cancelAnimationFrame(frame);
    }, []);

    const handleRequestReset = async (event) => {
        event.preventDefault();
        setRequestState({ loading: true, message: '', error: '' });

        try {
            const response = await requestAccessReset(requestForm.email);
            setResetForm((current) => ({ ...current, email: requestForm.email }));
            setRequestState({ loading: false, message: response.message, error: '' });
        } catch (error) {
            setRequestState({ loading: false, message: '', error: error.message || 'Failed to request reset code.' });
        }
    };

    const handleResetAccess = async (event) => {
        event.preventDefault();
        setResetState({ loading: true, message: '', error: '' });

        try {
            const response = await resetAccess(resetForm);
            setResetForm((current) => ({
                ...current,
                token: '',
                name: '',
                password: '',
                password_confirmation: '',
            }));
            setResetState({ loading: false, message: response.message, error: '' });
        } catch (error) {
            setResetState({ loading: false, message: '', error: error.message || 'Failed to reset account access.' });
        }
    };

    return (
        <AuthShell
            eyebrow="Access recovery"
            title="Reset account name and password"
            subtitle="Sign-in uses your email. This flow sends a reset code to that email and lets you update the admin account name and password."
            footer="Request a new code if the old one expires. Codes are valid for 60 minutes."
        >
            <div className="stack">
                <section className="panel">
                    <div className="panel-head">
                        <h2>1. Request reset code</h2>
                        <p>Enter the admin email used to sign in.</p>
                    </div>

                    {requestState.error ? <div className="notice error">{requestState.error}</div> : null}
                    {requestState.message ? <div className="notice success">{requestState.message}</div> : null}

                    <form onSubmit={handleRequestReset} className="auth-form">
                        <label className="field">
                            <span>Admin email</span>
                            <input
                                type="email"
                                value={requestForm.email}
                                onChange={(event) => {
                                    const nextEmail = event.target.value;
                                    setRequestForm({ email: nextEmail });
                                    setResetForm((current) => ({ ...current, email: nextEmail }));
                                }}
                                placeholder="admin@yourorg.org"
                                required
                            />
                        </label>

                        <button type="submit" className="submit-btn secondary" disabled={requestState.loading}>
                            {requestState.loading ? 'Sending code...' : 'Send reset code'}
                        </button>
                    </form>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h2>2. Update access</h2>
                        <p>Use the code from email and choose the new password. Updating the account name is optional.</p>
                    </div>

                    {resetState.error ? <div className="notice error">{resetState.error}</div> : null}
                    {resetState.message ? <div className="notice success">{resetState.message}</div> : null}

                    <form onSubmit={handleResetAccess} className="auth-form">
                        <label className="field">
                            <span>Admin email</span>
                            <input
                                type="email"
                                value={resetForm.email}
                                onChange={(event) => setResetForm({ ...resetForm, email: event.target.value })}
                                placeholder="admin@yourorg.org"
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Reset code</span>
                            <input
                                value={resetForm.token}
                                onChange={(event) => setResetForm({ ...resetForm, token: event.target.value.toUpperCase() })}
                                placeholder="AB12CD34"
                                required
                            />
                        </label>

                        <label className="field">
                            <span>New account name</span>
                            <input
                                value={resetForm.name}
                                onChange={(event) => setResetForm({ ...resetForm, name: event.target.value })}
                                placeholder="Optional: update admin display name"
                            />
                        </label>

                        <div className="split">
                            <label className="field">
                                <span>New password</span>
                                <input
                                    type="password"
                                    value={resetForm.password}
                                    onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
                                    placeholder="At least 8 characters"
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Confirm new password</span>
                                <input
                                    type="password"
                                    value={resetForm.password_confirmation}
                                    onChange={(event) => setResetForm({ ...resetForm, password_confirmation: event.target.value })}
                                    placeholder="Repeat password"
                                    required
                                />
                            </label>
                        </div>

                        <button type="submit" className="submit-btn" disabled={resetState.loading}>
                            {resetState.loading ? 'Updating access...' : 'Reset access'}
                        </button>
                    </form>
                </section>
            </div>

            <style jsx>{`
                .stack { display: grid; gap: 18px; }
                .panel {
                    padding: 22px;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    background: #fff;
                }
                .panel-head { margin-bottom: 18px; }
                .panel-head h2 { margin: 0 0 8px; color: #0f172a; font-size: 20px; }
                .panel-head p { margin: 0; color: #64748b; line-height: 1.6; }
                .auth-form { display: grid; gap: 16px; }
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
                .submit-btn.secondary {
                    background: linear-gradient(135deg, #0f172a, #475569);
                }
                .submit-btn:disabled { opacity: .65; cursor: not-allowed; }
                .notice {
                    margin-bottom: 16px;
                    border-radius: 16px;
                    padding: 12px 14px;
                    font-size: 14px;
                }
                .notice.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                .notice.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                @media (max-width: 640px) {
                    .split { grid-template-columns: 1fr; }
                }
            `}</style>
        </AuthShell>
    );
}
