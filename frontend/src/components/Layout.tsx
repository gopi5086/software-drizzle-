import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-background print:block">
      <div className="print:hidden">
        <Sidebar expanded={sidebarExpanded} onExpandChange={setSidebarExpanded} />
      </div>
      <div className={`flex-1 ${sidebarExpanded ? 'ml-[260px]' : 'ml-[72px]'} print:ml-0 transition-all duration-300`}>
        <div className="print:hidden">
          <TopBar expanded={sidebarExpanded} />
        </div>
        <main className="mt-20 p-10 print:mt-0 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
