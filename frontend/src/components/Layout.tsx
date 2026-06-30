import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background print:block">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[260px] print:ml-0">
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="mt-20 p-10 print:mt-0 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
