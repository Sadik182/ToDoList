"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/notes", label: "Notes" },
    { href: "/dashboard", label: "Dashboard" },
  ];

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
              // only mark active after mount so server/client match
              const isActive = mounted && pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  // only include aria-current when mounted & active
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
        </div>
      </div>
    </nav>
  );
}
