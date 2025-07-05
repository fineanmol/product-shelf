import React, { useState } from 'react';
import { FaBars, FaTimes, FaPlus } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import AnimatedButton from './AnimatedButton';

const DashboardLayout = ({ 
  children, 
  title, 
  subtitle,
  actions,
  sidebar,
  showAddButton = false,
  onAddClick
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="fixed inset-0 animated-bg opacity-5 pointer-events-none" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {sidebar && (
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="glass-card h-full rounded-none lg:rounded-r-3xl">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${sidebar ? 'lg:ml-64' : ''}`}>
        {/* Header */}
        <header className="glass-card m-4 mb-0 rounded-2xl">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              {sidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden neuro-button p-2 rounded-xl"
                >
                  {sidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
              )}
              
              <div>
                <h1 
                  className="text-2xl lg:text-3xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p 
                    className="text-sm lg:text-base mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions}
              <ThemeToggle />
              {showAddButton && (
                <AnimatedButton
                  variant="primary"
                  onClick={onAddClick}
                  className="hidden sm:flex"
                >
                  <FaPlus />
                  Add Product
                </AnimatedButton>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      {showAddButton && (
        <button
          onClick={onAddClick}
          className="fab sm:hidden"
          aria-label="Add Product"
        >
          <FaPlus />
        </button>
      )}
    </div>
  );
};

export default DashboardLayout;