"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPurchaser = role === "PURCHASER";

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close admin dropdown on route change
  useEffect(() => {
    setAdminOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const mainNav = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/catalog", label: "Catalog", show: true },
    { href: "/orders", label: "My Orders", show: true },
    { href: "/inventory", label: "Inventory", show: true },
    { href: "/approvals", label: "Approvals", show: isAdmin || isManager },
  ];

  const adminNav = [
    { href: "/admin/orders", label: "All Orders", show: isAdmin || isPurchaser },
    { href: "/admin/vendors", label: "Vendors", show: isAdmin || isPurchaser },
    { href: "/admin/products", label: "Products", show: isAdmin || isPurchaser },
    { href: "/admin/inventory", label: "Inventory Mgmt", show: isAdmin || isPurchaser },
    { href: "/admin/reports", label: "Reports", show: isAdmin },
    { href: "/admin/users", label: "Users", show: isAdmin },
  ];

  const visibleMain = mainNav.filter((item) => item.show);
  const visibleAdmin = adminNav.filter((item) => item.show);
  const allItems = [...visibleMain, ...visibleAdmin];
  const isAdminActive = visibleAdmin.some((item) => pathname.startsWith(item.href));

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
            {visibleMain.map((item) => (
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

            {/* Admin Dropdown */}
            {visibleAdmin.length > 0 && (
              <div ref={adminRef} className="relative">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isAdminActive
                      ? "bg-white/15 text-ias-gold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Admin
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${adminOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {adminOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-ias-charcoal border border-white/15 rounded-lg shadow-xl py-1 z-50">
                    {visibleAdmin.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith(item.href)
                            ? "bg-white/15 text-ias-gold"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
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

        {/* Mobile Nav — shows all items flat */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-white/10 mt-1 pt-2 space-y-1">
            {visibleMain.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-white/15 text-ias-gold"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {visibleAdmin.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-xs text-white/40 font-medium uppercase tracking-wider">
                  Admin
                </div>
                {visibleAdmin.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded text-sm ${
                      pathname.startsWith(item.href)
                        ? "bg-white/15 text-ias-gold"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
