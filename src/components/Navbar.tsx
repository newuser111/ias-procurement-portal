"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPurchaser = role === "PURCHASER";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/catalog", label: "Catalog", show: true },
    { href: "/orders", label: "My Orders", show: true },
    { href: "/approvals", label: "Approvals", show: isAdmin || isManager },
    { href: "/admin/orders", label: "All Orders", show: isAdmin || isPurchaser },
    { href: "/admin/vendors", label: "Vendors", show: isAdmin || isPurchaser },
    { href: "/admin/products", label: "Products", show: isAdmin || isPurchaser },
    { href: "/admin/reports", label: "Reports", show: isAdmin },
    { href: "/admin/users", label: "Users", show: isAdmin },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  return (
    <nav className="bg-ias-charcoal text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-ias-gold font-bold text-lg">IAS</span>
            <span className="text-sm font-medium hidden sm:inline">Procurement</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-white/15 text-ias-gold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{session?.user?.name}</div>
              <div className="text-xs text-white/60">
                {session?.user?.locationCode || role}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-white/10 mt-1 pt-2 space-y-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-white/15 text-ias-gold"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
