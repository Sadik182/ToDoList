"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
    router.refresh();
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/notes", label: "Notes" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  // Show loading state
  if (status === "loading" || !mounted) {
    return (
      <nav className="bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="text-xl font-semibold text-white tracking-tight">
              MyTodo
            </div>
            <div className="text-gray-300">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  // Show login/register buttons if not authenticated
  if (!session) {
    return (
      <nav className="bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="text-xl font-semibold text-white tracking-tight">
              MyTodo
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-semibold text-white tracking-tight"
          >
            MyTodo
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {links.map(({ href, label }) => {
              const isActive = mounted && pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  {...(isActive ? { "aria-current": "page" } : {})}
                  className={`text-sm font-medium transition-colors duration-200 text-xl text-gray-300 font-bold ${
                    isActive
                      ? "text-white border-b-2 border-white"
                      : " hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              Welcome, {session.user?.name}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
