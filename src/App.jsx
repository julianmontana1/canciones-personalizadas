import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import AdminLoginModal from './components/AdminLoginModal';
import TermsView from './components/TermsView';
import RefundsView from './components/RefundsView';
import PrivacyView from './components/PrivacyView';

const LEGAL_VIEWS = {
  '#/terminos': 'terms',
  '#/reembolsos': 'refunds',
  '#/privacidad': 'privacy'
};

// Deliberately not "#/admin" — this is the only way into the admin panel,
// with no button or link anywhere in the user-facing app. Keep it out of
// public docs/screenshots; change it here if it ever needs to be rotated.
const ADMIN_HASH = '#/PaneldeControl';

const resolveViewFromHash = () => {
  if (window.location.hash === ADMIN_HASH) return 'admin';
  return LEGAL_VIEWS[window.location.hash] || 'user';
};

export default function App() {
  const [currentView, setCurrentView] = useState(() => resolveViewFromHash()); // 'user' | 'admin' | 'terms'
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('el_admin_key') || '');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => window.location.hash === ADMIN_HASH && !sessionStorage.getItem('el_admin_key'));

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === ADMIN_HASH) {
        if (!sessionStorage.getItem('el_admin_key')) {
          setIsLoginModalOpen(true);
        } else {
          setCurrentView('admin');
        }
      } else {
        setCurrentView(resolveViewFromHash());
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Legal pages (Términos/Reembolsos/Privacidad) all navigate between each other and
  // back home purely through the hash — the hashchange listener above picks it up.
  const navigateLegal = (hash) => {
    window.location.hash = hash;
  };

  const handleSelectView = (view) => {
    if (view === 'admin') {
      window.location.hash = ADMIN_HASH;
    } else {
      window.location.hash = '';
      setCurrentView('user');
    }
  };

  const handleAdminLoginSuccess = (key) => {
    setAdminKey(key);
    sessionStorage.setItem('el_admin_key', key);
    setIsLoginModalOpen(false);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setAdminKey('');
    sessionStorage.removeItem('el_admin_key');
    window.location.hash = '';
    setCurrentView('user');
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col bg-[#080c16] text-gray-100 selection:bg-purple-500 selection:text-white">
      {/* Dynamic ambient lights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'user' && <UserView />}
        {currentView === 'terms' && <TermsView onNavigate={navigateLegal} />}
        {currentView === 'refunds' && <RefundsView onNavigate={navigateLegal} />}
        {currentView === 'privacy' && <PrivacyView onNavigate={navigateLegal} />}
        {currentView === 'admin' && (
          <AdminView
            adminKey={adminKey}
            onLogout={handleAdminLogout}
            onBackToUser={() => setCurrentView('user')}
          />
        )}
      </main>

      {/* Superadmin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Minimal Footer */}
      {currentView === 'admin' && (
        <footer className="border-t border-gray-900 bg-gray-950/60 py-6 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} SerenatIA • Panel de Administración</p>
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span>Gestión de Códigos y Canciones</span>
            </div>
          </div>
        </footer>
      )}
    </div>
    </ErrorBoundary>
  );
}
