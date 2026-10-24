import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background print:block overflow-x-hidden">
      <div className="print:hidden">
        <Sidebar
          expanded={sidebarExpanded}
          onExpandChange={setSidebarExpanded}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>
      <div className={`flex-1 ml-0 ${sidebarExpanded ? 'md:ml-[260px]' : 'md:ml-[72px]'} print:ml-0 transition-all duration-300 min-w-0 max-w-full`}>
        <div className="print:hidden">
          <TopBar
            expanded={sidebarExpanded}
            onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />
        </div>
        <main className="mt-16 sm:mt-20 p-3.5 sm:p-6 lg:p-10 print:mt-0 print:p-0 min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
