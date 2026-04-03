'use client';
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredOrganization, getStoredUser, isAuthenticated, logout } from '@/lib/api';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MessageCenter from '@/components/MessageCenter';
import MembersManagement from '@/components/MembersManagement';
import OrganizationSettings from '@/components/OrganizationSettings';
import TemplateLibrary from '@/components/TemplateLibrary';
import SMSCreditManagement from '@/components/SMSCreditManagement';

export default function DashboardPage() {
    const router = useRouter();
    const navItems = [
        { id: 'analytics', label: '📊 Analytics' },
        { id: 'members', label: '👥 Members' },
        { id: 'messages', label: '✉️ Messages' },
        { id: 'templates', label: '🎨 Templates' },
        { id: 'settings', label: '⚙️ Settings' },
        { id: 'credits', label: '💳 Credits' },
    ];
    const [view, setView] = useState('analytics');
    const [menuOpen, setMenuOpen] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);

    useEffect(() => {
        const nextAuthenticated = isAuthenticated();
        const frame = window.requestAnimationFrame(() => {
            setAuthenticated(nextAuthenticated);
            setUser(nextAuthenticated ? getStoredUser() : null);
            setOrganization(nextAuthenticated ? getStoredOrganization() : null);
            setAuthReady(true);
        });

        if (!nextAuthenticated) {
            router.replace('/login');
        }

        return () => window.cancelAnimationFrame(frame);
    }, [router]);

    useEffect(() => {
        if (!authReady) {
            return undefined;
        }

        const handleOrganizationUpdated = (event) => {
            setOrganization(event.detail);
        };

        window.addEventListener('organization-updated', handleOrganizationUpdated);

        return () => {
            window.removeEventListener('organization-updated', handleOrganizationUpdated);
        };
    }, [authReady]);

    if (!authReady) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #fffaf5 0%, #f8fafc 26%, #f8fafc 100%)',
                color: '#64748b',
                fontSize: '16px',
                fontWeight: 600,
            }}>
                Loading dashboard...
            </div>
        );
    }

    if (!authenticated) return null;

    const handleSelectView = (nextView) => {
        setView(nextView);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
    };

    return (
        <div className="app">
            <nav className="nav">
                <div className="brand">
                    <Image
                        src="/brand/celebrationhub-icon-192.png"
                        alt="CelebrationHub icon"
                        width={36}
                        height={36}
                        className="brand-icon"
                        priority
                    />
                    <span>CelebrationHub</span>
                </div>

                <div className="nav-links desktop-nav-links">
                    {navItems.map(({ id, label }) => (
                        <button
                            key={id}
                            className={view === id ? 'active' : ''}
                            onClick={() => handleSelectView(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="nav-right desktop-nav-right">
                    <div className="org-chip">
                        {organization?.logo_url ? (
                            <img src={organization.logo_url} alt={`${organization?.name || 'Organization'} logo`} className="org-logo" />
                        ) : (
                            <span className="org-initial">{organization?.name?.[0] || 'O'}</span>
                        )}
                        <span className="org-name">{organization?.name}</span>
                    </div>
                    <span className="user-name">{user?.name}</span>
                    <button className="logout-btn" onClick={handleLogout}>Sign out</button>
                </div>

                <button
                    className="menu-toggle"
                    type="button"
                    aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((current) => !current)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </nav>

            {menuOpen && <button className="menu-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}

            <aside className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="brand">
                        <Image
                            src="/brand/celebrationhub-icon-192.png"
                            alt="CelebrationHub icon"
                            width={36}
                            height={36}
                            className="brand-icon"
                        />
                        <span>CelebrationHub</span>
                    </div>
                    <button className="drawer-close" type="button" onClick={() => setMenuOpen(false)}>×</button>
                </div>

                <div className="drawer-org">
                    <div className="org-chip">
                        {organization?.logo_url ? (
                            <img src={organization.logo_url} alt={`${organization?.name || 'Organization'} logo`} className="org-logo" />
                        ) : (
                            <span className="org-initial">{organization?.name?.[0] || 'O'}</span>
                        )}
                        <span className="org-name">{organization?.name}</span>
                    </div>
                    <span className="user-name">{user?.name}</span>
                </div>

                <div className="drawer-links">
                    {navItems.map(({ id, label }) => (
                        <button
                            key={id}
                            className={view === id ? 'active' : ''}
                            onClick={() => handleSelectView(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button className="logout-btn drawer-logout" onClick={handleLogout}>Sign out</button>
            </aside>

            <main className="main">
                {view === 'analytics' && <AnalyticsDashboard />}
                {view === 'members' && <MembersManagement />}
                {view === 'messages' && <MessageCenter />}
                {view === 'templates' && <TemplateLibrary />}
                {view === 'settings' && <OrganizationSettings />}
                {view === 'credits'   && <SMSCreditManagement />}
            </main>

            <style jsx>{`
                .app { min-height: 100vh; background: linear-gradient(180deg, #fffaf5 0%, #f8fafc 26%, #f8fafc 100%); }
                .nav {
                    background: rgba(255,255,255,0.9);
                    border-bottom: 1px solid #e5e7eb;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    min-height: 68px;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    backdrop-filter: blur(12px);
                }
                .brand { display: flex; align-items: center; gap: 10px; font-family: Georgia,serif; font-size: 20px; white-space: nowrap; color: #0f172a; }
                .brand-icon { border-radius: 12px; }
                .nav-links { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
                .nav-links button {
                    background: none; border: none; padding: 10px 16px;
                    font-size: 14px; cursor: pointer; border-radius: 999px;
                    color: #64748b; transition: all 0.15s;
                }
                .nav-links button:hover { background: #f1f5f9; color: #0f172a; }
                .nav-links button.active { background: linear-gradient(135deg, #1d4ed8, #f97316); color: white; box-shadow: 0 10px 20px rgba(29,78,216,0.18); }
                .nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
                .menu-toggle {
                    display: none;
                    width: 44px;
                    height: 44px;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    background: white;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 4px;
                    margin-left: auto;
                    cursor: pointer;
                }
                .menu-toggle span {
                    display: block;
                    width: 18px;
                    height: 2px;
                    background: #0f172a;
                    border-radius: 999px;
                }
                .menu-backdrop {
                    position: fixed;
                    inset: 0;
                    border: none;
                    background: rgba(15, 23, 42, 0.38);
                    z-index: 55;
                }
                .mobile-drawer {
                    position: fixed;
                    top: 0;
                    right: 0;
                    height: 100vh;
                    width: min(82vw, 320px);
                    padding: 20px 18px 24px;
                    background: rgba(255,255,255,0.97);
                    backdrop-filter: blur(16px);
                    border-left: 1px solid #e2e8f0;
                    box-shadow: -10px 0 35px rgba(15, 23, 42, 0.12);
                    display: grid;
                    align-content: start;
                    gap: 18px;
                    transform: translateX(105%);
                    transition: transform 0.22s ease;
                    z-index: 60;
                }
                .mobile-drawer.open { transform: translateX(0); }
                .drawer-header,
                .drawer-org {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .drawer-close {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    font-size: 24px;
                    line-height: 1;
                    cursor: pointer;
                    color: #475569;
                }
                .drawer-org {
                    align-items: flex-start;
                    flex-direction: column;
                }
                .drawer-links {
                    display: grid;
                    gap: 10px;
                }
                .drawer-links button {
                    border: none;
                    border-radius: 18px;
                    padding: 14px 16px;
                    background: #f8fafc;
                    color: #475569;
                    text-align: left;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .drawer-links button.active {
                    background: linear-gradient(135deg, #1d4ed8, #f97316);
                    color: white;
                }
                .org-chip { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0; }
                .org-logo, .org-initial {
                    width: 30px;
                    height: 30px;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    object-fit: cover;
                    background: linear-gradient(135deg, #1d4ed8, #f97316);
                    color: white;
                    font-size: 12px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .org-name { font-size: 13px; color: #334155; font-weight: 700; }
                .user-name { font-size: 14px; color: #64748b; }
                .logout-btn {
                    background: none; border: 1px solid #e5e7eb;
                    padding: 8px 14px; border-radius: 999px; font-size: 13px;
                    cursor: pointer; color: #64748b; transition: all 0.15s;
                }
                .logout-btn:hover { border-color: #dc2626; color: #dc2626; }
                .drawer-logout { width: 100%; justify-self: stretch; }
                .main { padding: 28px 24px 40px; }
                @media (max-width: 768px) {
                    .nav {
                        padding: 12px 16px;
                        gap: 12px;
                    }
                    .desktop-nav-links,
                    .desktop-nav-right {
                        display: none;
                    }
                    .menu-toggle {
                        display: inline-flex;
                    }
                    .main { padding: 18px 16px 28px; }
                }
                @media (min-width: 769px) {
                    .mobile-drawer,
                    .menu-backdrop {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
