"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          MyTodo
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm hover:underline">
            Home
          </Link>
          <Link href="#" className="text-sm text-gray-500">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
