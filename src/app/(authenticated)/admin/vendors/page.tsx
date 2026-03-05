"use client";

import { useEffect, useState } from "react";

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  accountNumber: string | null;
  paymentTerms: string | null;
  active: boolean;
  _count: { products: number; purchaseOrders: number };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/vendors")
      .then((r) => r.json())
      .then(setVendors)
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Vendors</h1>
          <p className="text-ias-gray-500 text-sm mt-1">{vendors.length} vendors</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Vendor</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Contact</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Products</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Orders</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Terms</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-ias-gray-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-ias-charcoal">{v.name}</div>
                  <div className="text-xs text-ias-gray-400 font-mono">{v.code}</div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {v.contactName ? (
                    <div>
                      <div className="text-ias-gray-700 text-sm">{v.contactName}</div>
                      {v.contactEmail && <div className="text-xs text-ias-gray-400">{v.contactEmail}</div>}
                    </div>
                  ) : (
                    <span className="text-ias-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center text-ias-gray-600">{v._count.products}</td>
                <td className="px-5 py-3 text-center text-ias-gray-600">{v._count.purchaseOrders}</td>
                <td className="px-5 py-3 text-ias-gray-500 hidden sm:table-cell">{v.paymentTerms || "—"}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${v.active ? "bg-ias-success" : "bg-ias-gray-300"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-ias-gray-400 text-sm">No vendors found</div>
        )}
      </div>
    </div>
  );
}
