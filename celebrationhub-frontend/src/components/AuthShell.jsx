'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AuthShell({
    eyebrow,
    title,
    subtitle,
    children,
    footer,
}) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="brand-row">
                    <div className="brand-icon">
                        <Image src="/brand/celebrationhub-icon-192.png" alt="CelebrationHub icon" width={72} height={72} priority />
                    </div>
                    <div>
                        <p className="eyebrow">{eyebrow}</p>
                        <h1>{title}</h1>
                        <p className="subtitle">{subtitle}</p>
                    </div>
                </div>

                {children}

                <div className="auth-footer">
                    <Link href="/login">Sign in</Link>
                    <Link href="/register">Register</Link>
                    <Link href="/reset-access">Reset access</Link>
                </div>

                {footer ? <div className="footer-note">{footer}</div> : null}
            </div>

            <style jsx>{`
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background:
                        radial-gradient(circle at top left, rgba(249, 115, 22, 0.18), transparent 35%),
                        radial-gradient(circle at bottom right, rgba(29, 78, 216, 0.18), transparent 40%),
                        linear-gradient(135deg, #f8fafc, #e2e8f0);
                }

                .auth-card {
                    width: 100%;
                    max-width: 560px;
                    background: rgba(255, 255, 255, 0.92);
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    border-radius: 30px;
                    padding: 32px;
                    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
                    backdrop-filter: blur(12px);
                }

                .brand-row {
                    display: flex;
                    gap: 18px;
                    align-items: center;
                    margin-bottom: 28px;
                }

                .brand-icon {
                    flex-shrink: 0;
                    width: 86px;
                    height: 86px;
                    border-radius: 26px;
                    padding: 7px;
                    background: linear-gradient(135deg, rgba(29, 78, 216, 0.12), rgba(249, 115, 22, 0.15));
                }

                .eyebrow {
                    margin: 0 0 8px;
                    color: #c2410c;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                }

                h1 {
                    margin: 0 0 8px;
                    font-family: Georgia, serif;
                    font-size: 34px;
                    line-height: 1.05;
                    color: #0f172a;
                }

                .subtitle {
                    margin: 0;
                    color: #64748b;
                    line-height: 1.6;
                }

                .auth-footer {
                    display: flex;
                    justify-content: center;
                    gap: 18px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }

                .auth-footer :global(a) {
                    color: #1d4ed8;
                    font-weight: 600;
                    text-decoration: none;
                }

                .auth-footer :global(a:hover) {
                    text-decoration: underline;
                }

                .footer-note {
                    margin-top: 18px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.6;
                }

                @media (max-width: 640px) {
                    .auth-card {
                        padding: 24px;
                        border-radius: 24px;
                    }

                    .brand-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    h1 {
                        font-size: 29px;
                    }
                }
            `}</style>
        </div>
    );
}
