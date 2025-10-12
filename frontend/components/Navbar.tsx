// components/Navbar.tsx - REFORGED

'use client';

import Link from 'next/link';
import { useAuth } from '@/context/Authcontext';
import Button from './Button'; // We will use our new button style

const AuthenticatedNav = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Button
      onClick={onLogout}
      className="py-2 px-4 border-blood-echo/50 text-blood-echo/80 hover:bg-blood-echo/10 hover:text-blood-echo hover:border-blood-echo"
    >
      Sever Connection
    </Button>
  );
};

const GuestNav = () => {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/login" className="text-paleblood-sky/80 hover:text-paleblood-sky transition-colors duration-300 uppercase tracking-widest text-sm">
        Login
      </Link>
      <Link href="/register">
        <Button className="py-2 px-4">Register</Button>
      </Link>
    </div>
  );
};

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="p-4 flex justify-between items-center border-b border-paleblood-sky/20 font-serif">
      <Link href="/">
        <div className="text-2xl font-bold uppercase tracking-[0.3em] text-parchment/80 hover:text-parchment transition-colors duration-300 cursor-pointer">
          Task Hunter
        </div>
      </Link>

      <div>
        {isAuthenticated ? <AuthenticatedNav onLogout={logout} /> : <GuestNav />}
      </div>
    </nav>
  );
}