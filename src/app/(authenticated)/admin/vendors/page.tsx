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
          <p className="text-ias-gray-500 text-sm mt-1">{vendors.length} vendors in directory</p>
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

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-ias-charcoal">{vendor.name}</h3>
                <span className="text-xs text-ias-gray-400 font-mono">{vendor.code}</span>
              </div>
              <span className={`w-2 h-2 rounded-full mt-1.5 ${vendor.active ? "bg-ias-success" : "bg-ias-gray-300"}`} />
            </div>

            <div className="mt-3 space-y-1 text-sm text-ias-gray-600">
              {vendor.contactName && <div>{vendor.contactName}</div>}
              {vendor.contactEmail && <div className="text-xs">{vendor.contactEmail}</div>}
              {vendor.contactPhone && <div className="text-xs">{vendor.contactPhone}</div>}
              {vendor.paymentTerms && <div className="text-xs text-ias-gray-400">{vendor.paymentTerms}</div>}
            </div>

            <div className="mt-3 pt-3 border-t border-ias-gray-100 flex gap-4 text-xs text-ias-gray-500">
              <span>{vendor._count.products} products</span>
              <span>{vendor._count.purchaseOrders} orders</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
