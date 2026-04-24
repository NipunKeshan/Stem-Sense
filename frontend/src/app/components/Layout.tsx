import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from './ChatWidget';
import { useState } from 'react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-24">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}

