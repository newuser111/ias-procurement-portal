"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ParLevelItem {
  id: string;
  productId: string;
  locationId: string;
  minLevel: number;
  maxLevel: number | null;
  currentQty: number;
  status: "OK" | "LOW" | "OUT";
  lastCounted: string | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unitPrice: number;
    unitOfMeasure: string;
    vendor: { id: string; name: string; code: string };
    category: { id: string; name: string } | null;
  };
  location: { id: string; name: string; code: string };
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const [parLevels, setParLevels] = useState<ParLevelItem[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const role = session?.user?.role;
  const isAdminOrPurchaser = role === "ADMIN" || role === "PURCHASER";

  useEffect(() => {
    const params = new URLSearchParams();
    if (locationId) params.set("locationId", locationId);

    fetch(`/api/inventory/par-levels?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setParLevels(data.parLevels || []);
        if (data.locations) setLocations(data.locations);
        if (data.categories) setCategories(data.categories);
      })
      .finally(() => setLoading(false));
  }, [locationId]);

  const filtered = parLevels.filter((pl) => {
    if (categoryFilter && pl.product.category?.id !== categoryFilter) return false;
    if (statusFilter && pl.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        pl.product.name.toLowerCase().includes(q) ||
        pl.product.vendor.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const belowPar = parLevels.filter((p) => p.status === "LOW" || p.status === "OUT");
  const okCount = parLevels.filter((p) => p.status === "OK").length;
  const lastCountDate = parLevels
    .filter((p) => p.lastCounted)
    .sort((a, b) => new Date(b.lastCounted!).getTime() - new Date(a.lastCounted!).getTime())[0]?.lastCounted;

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Inventory</h1>
          <p className="text-ias-gray-500 text-sm mt-1">
            {parLevels.length} products tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/inventory/count"
            className="px-4 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors"
          >
            Start Count
          </Link>
          {isAdminOrPurchaser && (
            <Link
              href="/admin/inventory"
              className="px-4 py-2 bg-white border border-ias-gray-300 text-ias-charcoal rounded-lg text-sm font-medium hover:bg-ias-gray-50 transition-colors"
            >
              Manage Inventory
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-charcoal">{parLevels.length}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Products Tracked</div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm border ${belowPar.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-ias-gray-200"}`}>
          <div className={`text-2xl font-bold ${belowPar.length > 0 ? "text-red-700" : "text-ias-charcoal"}`}>
            {belowPar.length}
          </div>
          <div className={`text-xs mt-1 ${belowPar.length > 0 ? "text-red-600" : "text-ias-gray-500"}`}>
            Below Par
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-success">{okCount}</div>
          <div className="text-xs text-ias-gray-500 mt-1">At / Above Par</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-charcoal">
            {lastCountDate ? new Date(lastCountDate).toLocaleDateString() : "—"}
          </div>
          <div className="text-xs text-ias-gray-500 mt-1">Last Count</div>
        </div>
      </div>

      {/* Reorder Alerts */}
      {belowPar.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {belowPar.length} item{belowPar.length !== 1 ? "s" : ""} below par level
          </h2>
          <div className="space-y-2">
            {belowPar.slice(0, 5).map((pl) => (
              <div key={pl.id} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-red-900">{pl.product.name}</span>
                  <span className="text-red-600 ml-2 text-xs">{pl.product.vendor.name}</span>
                  {isAdminOrPurchaser && (
                    <span className="text-red-500 ml-2 text-xs">@ {pl.location.name}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-bold ${pl.currentQty === 0 ? "text-red-700" : "text-red-600"}`}>
                    {pl.currentQty}
                  </span>
                  <span className="text-red-400 mx-1">/</span>
                  <span className="text-red-500">{pl.minLevel} min</span>
                </div>
              </div>
            ))}
            {belowPar.length > 5 && (
              <p className="text-xs text-red-600 text-center pt-1">
                + {belowPar.length - 5} more items below par
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isAdminOrPurchaser && (
          <select
            value={locationId}
            onChange={(e) => { setLocationId(e.target.value); setLoading(true); }}
            className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm"
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or vendors..."
            className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="OUT">Out of Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OK">In Stock</option>
        </select>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Product</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Vendor</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden lg:table-cell">Category</th>
              {isAdminOrPurchaser && !locationId && (
                <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Location</th>
              )}
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Current</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Par Min</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Par Max</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Status</th>
              <th className="text-right px-5 py-3 font-medium text-ias-gray-600 hidden lg:table-cell">Last Counted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {filtered.map((pl) => (
              <tr key={pl.id} className="hover:bg-ias-gray-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-ias-charcoal">{pl.product.name}</div>
                  {pl.product.sku && <div className="text-xs text-ias-gray-400">SKU: {pl.product.sku}</div>}
                </td>
                <td className="px-5 py-3 text-ias-gray-600 hidden md:table-cell">{pl.product.vendor.name}</td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  {pl.product.category ? (
                    <span className="px-2 py-0.5 bg-ias-gray-100 rounded text-xs text-ias-gray-600">{pl.product.category.name}</span>
                  ) : (
                    <span className="text-ias-gray-300">—</span>
                  )}
                </td>
                {isAdminOrPurchaser && !locationId && (
                  <td className="px-5 py-3 text-ias-gray-600 text-sm hidden sm:table-cell">{pl.location.name}</td>
                )}
                <td className="px-5 py-3 text-center">
                  <span className={`font-bold ${pl.status === "OUT" ? "text-red-600" : pl.status === "LOW" ? "text-amber-600" : "text-ias-charcoal"}`}>
                    {pl.currentQty}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-ias-gray-600">{pl.minLevel}</td>
                <td className="px-5 py-3 text-center text-ias-gray-500 hidden sm:table-cell">{pl.maxLevel ?? "—"}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    pl.status === "OUT"
                      ? "bg-red-100 text-red-700"
                      : pl.status === "LOW"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}>
                    {pl.status === "OUT" ? "Out" : pl.status === "LOW" ? "Low" : "OK"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-ias-gray-500 text-xs hidden lg:table-cell">
                  {pl.lastCounted ? new Date(pl.lastCounted).toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-ias-gray-400 text-sm">
            {parLevels.length === 0
              ? "No par levels set up yet. Admin can configure par levels in Inventory Management."
              : "No products match your filters"}
          </div>
        )}
      </div>
    </div>
  );
}
