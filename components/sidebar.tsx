"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BotMessageSquare, Building, Users, Settings } from 'lucide-react';

// A helper function to apply active styles
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-gray-200 ${
        isActive ? "bg-gray-200 text-black font-semibold" : "text-gray-600"
      }`}
    >
      {children}
    </Link>
  );
};

export function Sidebar() {
  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold" href="#">
            {/* You can replace this with the actual Lidl logo SVG */}
            <span className="text-xl">Flowbit AI</span> 
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <NavLink href="/">
              <Home className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink href="#">
              <FileText className="h-4 w-4" />
              Invoice
            </NavLink>
            <NavLink href="/chat">
              <BotMessageSquare className="h-4 w-4" />
              Chat with Data
            </NavLink>
            <NavLink href="#">
              <Building className="h-4 w-4" />
              Departments
            </NavLink>
            <NavLink href="#">
              <Users className="h-4 w-4" />
              Users
            </NavLink>
            <NavLink href="#">
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}