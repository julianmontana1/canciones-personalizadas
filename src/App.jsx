import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import AdminLoginModal from './components/AdminLoginModal';

export default function App() {
  const [currentView, setCurrentView] = useState(() => window.location.hash === '#/admin' ? 'admin' : 'user'); // 'user' | 'admin'
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('el_admin_key') || '');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => window.location.hash === '#/admin' && !sessionStorage.getItem('el_admin_key'));

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/admin') {
        if (!sessionStorage.getItem('el_admin_key')) {
          setIsLoginModalOpen(true);
        } else {
          setCurrentView('admin');
        }
      } else {
        setCurrentView('user');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAdminAuthenticated = Boolean(adminKey);

  const handleSelectView = (view) => {
    if (view === 'admin') {
      window.location.hash = '#/admin';
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
    <div className="min-h-screen flex flex-col bg-[#080c16] text-gray-100 selection:bg-purple-500 selection:text-white">
      {/* Dynamic ambient lights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'user' ? (
          <UserView />
        ) : (
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
  );
}
