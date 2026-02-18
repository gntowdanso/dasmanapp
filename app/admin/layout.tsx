'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  FileDown, 
  ListOrdered, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logout } from '@/app/actions/auth';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Import Customers', href: '/admin/import', icon: Upload },
  { name: 'Trigger SMS', href: '/admin/sms/trigger', icon: MessageSquare },
  { name: 'Download Mandates', href: '/admin/mandates/download', icon: FileDown },
  { name: 'SMS Logs', href: '/admin/sms/logs', icon: ListOrdered },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-blue-800">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 p-2 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Letshego</h1>
                <p className="text-xs text-blue-300 font-medium">Ghana Mandates</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              className="absolute top-4 right-4 lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-blue-800 text-white shadow-sm ring-1 ring-white/10' 
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-yellow-400' : 'text-blue-300 group-hover:text-yellow-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-blue-800 bg-blue-950/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-yellow-400">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-blue-300 truncate">admin@dasman.com</p>
              </div>
            </div>
            <button
                onClick={() => logout()}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-300 rounded-lg hover:bg-red-900/20 hover:text-red-200 transition-colors"
            >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-900 p-1.5 rounded-md">
                <LayoutDashboard className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="font-bold text-blue-900">Letshego</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
