"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Stethoscope, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', path: '/cases', icon: Stethoscope },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-[#E2E8F0] h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0]">
        <Stethoscope className="text-[#0E7490] mr-2" size={24} />
        <span className="text-xl font-bold text-[#1E293B]">VirtualCare</span>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-[#E0F2FE] text-[#0E7490]' 
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-[#1E293B] truncate">{user?.email}</p>
          <p className="text-xs text-[#64748B]">Doctor</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg font-medium transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
