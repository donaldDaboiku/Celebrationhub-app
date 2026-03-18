'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout, getStoredUser } from '@/lib/api';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import TemplateLibrary from '@/components/TemplateLibrary';
import SMSCreditManagement from '@/components/SMSCreditManagement';

export default function DashboardPage() {
    const router              = useRouter();
    const [view, setView]     = useState('analytics');
    const [user, setUser]     = useState(null);
    const [ready, setReady]   = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
            return;
        }
        setUser(getStoredUser());
        setReady(true);
    }, [router]);

    if (!ready) return null;

    return (
        <div className="app">
            <nav className="nav">
                <span className="brand">🎉 CelebrationHub</span>

                <div className="nav-links">
                    {[
                        { id: 'analytics', label: '📊 Analytics' },
                        { id: 'templates', label: '🎨 Templates' },
                        { id: 'credits',   label: '💳 Credits' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            className={view === id ? 'active' : ''}
                            onClick={() => setView(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="nav-right">
                    <span className="user-name">{user?.name}</span>
                    <button className="logout-btn" onClick={logout}>Sign out</button>
                </div>
            </nav>

            <main className="main">
                {view === 'analytics' && <AnalyticsDashboard />}
                {view === 'templates' && <TemplateLibrary />}
                {view === 'credits'   && <SMSCreditManagement />}
            </main>

            <style jsx>{`
                .app { min-height: 100vh; background: #f9fafb; }
                .nav {
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    height: 56px;
                }
                .brand { font-family: Georgia,serif; font-size: 18px; white-space: nowrap; }
                .nav-links { display: flex; gap: 4px; flex: 1; }
                .nav-links button {
                    background: none; border: none; padding: 8px 16px;
                    font-size: 14px; cursor: pointer; border-radius: 6px;
                    color: #666; transition: all 0.15s;
                }
                .nav-links button:hover { background: #f3f4f6; color: #111; }
                .nav-links button.active { background: #4f46e5; color: white; }
                .nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
                .user-name { font-size: 14px; color: #666; }
                .logout-btn {
                    background: none; border: 1px solid #e5e7eb;
                    padding: 6px 14px; border-radius: 6px; font-size: 13px;
                    cursor: pointer; color: #666; transition: all 0.15s;
                }
                .logout-btn:hover { border-color: #dc2626; color: #dc2626; }
                .main { padding: 24px; }
                @media (max-width: 768px) {
                    .nav { flex-wrap: wrap; height: auto; padding: 12px; gap: 8px; }
                    .nav-links { width: 100%; justify-content: center; }
                    .nav-right { width: 100%; justify-content: center; }
                }
            `}</style>
        </div>
    );
}
