'use client';
import { useState } from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import TemplateLibrary from '@/components/TemplateLibrary';
import SMSCreditManagement from '@/components/SMSCreditManagement';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('analytics');

  return (
    <div className="dashboard-container">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <h1>CelebrationHub</h1>
        <div className="nav-links">
          <button
            className={activeView === 'analytics' ? 'active' : ''}
            onClick={() => setActiveView('analytics')}
          >
            📊 Analytics
          </button>
          <button
            className={activeView === 'templates' ? 'active' : ''}
            onClick={() => setActiveView('templates')}
          >
            🎨 Templates
          </button>
          <button
            className={activeView === 'credits' ? 'active' : ''}
            onClick={() => setActiveView('credits')}
          >
            💳 SMS Credits
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeView === 'analytics' && <AnalyticsDashboard />}
        {activeView === 'templates' && <TemplateLibrary />}
        {activeView === 'credits' && <SMSCreditManagement />}
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f9fafb;
        }

        .dashboard-nav {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-nav h1 {
          font-family: Georgia, serif;
          font-size: 24px;
          margin: 0;
        }

        .nav-links {
          display: flex;
          gap: 8px;
        }

        .nav-links button {
          background: none;
          border: none;
          padding: 12px 20px;
          font-size: 15px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          color: #666;
        }

        .nav-links button:hover {
          background: #f3f4f6;
        }

        .nav-links button.active {
          background: #4f46e5;
          color: white;
        }

        .dashboard-main {
          padding: 24px;
        }

        @media (max-width: 768px) {
          .dashboard-nav {
            flex-direction: column;
            gap: 16px;
          }

          .nav-links {
            width: 100%;
            flex-direction: column;
          }

          .nav-links button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}