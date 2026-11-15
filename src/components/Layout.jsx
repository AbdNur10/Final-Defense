// frontend/src/components/Layout.jsx
import React, { useState } from 'react';
import Sidebar from './SIdeBar';
import Navbar from './Navbar';
import { FaBars, FaTimes } from 'react-icons/fa';
import './AppShell.css';

const Layout = ({ children, showSidebar = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className='app-frame min-h-screen flex flex-col'>
      {/* Mobile Header - Only show when sidebar is enabled */}
      {showSidebar && (
        <div className="app-mobile-header lg:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="app-mobile-toggle"
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {isMobileMenuOpen ? <FaTimes className="size-5" /> : <FaBars className="size-5" />}
          </button>
          <h1 className="app-mobile-header__brand">KYAU CHAT</h1>
          <div className="w-8"></div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && showSidebar && (
        <div
          className="app-mobile-overlay lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className='flex flex-1'>
        {/* Sidebar - Desktop always visible, Mobile as slide-in */}
        {showSidebar && (
          <div className={`
            fixed lg:relative z-50
            w-[260px] h-full
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        <div className='app-content'>
          <Navbar />
          <main className='app-main'>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;