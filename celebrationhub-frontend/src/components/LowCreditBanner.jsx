'use client';

import { useEffect, useState } from 'react';
import { getCreditWarningCopy, shouldShowCreditWarning } from '@/lib/credits';
import { useSmsCredits } from '@/hooks/useSmsCredits';

const DISMISS_KEY = 'celebrationhub_credit_warning_dismissed';

export default function LowCreditBanner({ onTopUp, hidden = false }) {
    const { balance, status, loading } = useSmsCredits({ enabled: !hidden });
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || balance === null) {
            return;
        }

        const dismissedFor = window.sessionStorage.getItem(DISMISS_KEY);
        setDismissed(dismissedFor === String(balance));
    }, [balance]);

    if (hidden || loading || !shouldShowCreditWarning(status)) {
        return null;
    }

    if (dismissed) {
        return null;
    }

    const copy = getCreditWarningCopy(balance, status);

    const handleDismiss = () => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(DISMISS_KEY, String(balance));
        }
        setDismissed(true);
    };

    return (
        <div className={`credit-banner ${status}`} role="alert">
            <div className="credit-banner-copy">
                <strong>{copy.title}</strong>
                <p>{copy.message}</p>
            </div>
            <div className="credit-banner-actions">
                <button type="button" className="top-up-btn" onClick={onTopUp}>
                    Top up credits
                </button>
                <button type="button" className="dismiss-btn" onClick={handleDismiss} aria-label="Dismiss warning">
                    Dismiss
                </button>
            </div>

            <style jsx>{`
                .credit-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin: 0 auto 20px;
                    max-width: 1200px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    border: 1px solid transparent;
                }

                .credit-banner.low {
                    background: #fffbeb;
                    border-color: #fcd34d;
                    color: #92400e;
                }

                .credit-banner.critical {
                    background: #fef2f2;
                    border-color: #fca5a5;
                    color: #991b1b;
                }

                .credit-banner-copy strong {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 15px;
                }

                .credit-banner-copy p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.45;
                }

                .credit-banner-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }

                .top-up-btn {
                    border: none;
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .credit-banner.low .top-up-btn {
                    background: #f59e0b;
                    color: white;
                }

                .credit-banner.critical .top-up-btn {
                    background: #dc2626;
                    color: white;
                }

                .dismiss-btn {
                    border: none;
                    background: transparent;
                    color: inherit;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    opacity: 0.85;
                }

                @media (max-width: 768px) {
                    .credit-banner {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .credit-banner-actions {
                        justify-content: flex-end;
                    }
                }
            `}</style>
        </div>
    );
}
