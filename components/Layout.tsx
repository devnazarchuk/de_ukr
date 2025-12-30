import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, action }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      {title && (
        <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
          <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          {action && <div>{action}</div>}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        <div className="max-w-md mx-auto min-h-full">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
