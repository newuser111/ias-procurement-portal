"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReorderVendorGroup {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  totalEstimatedCost: number;
  itemCount: number;
  items: {
    productId: string;
    productName: string;
    sku: string | null;
    vendorName: string;
    locationName: string;
    locationCode: string;
    currentQty: number;
    minLevel: number;
    maxLevel: number | null;
    deficit: number;
    suggestedQty: number;
    unitPrice: number;
    unitOfMeasure: string;
    estimatedCost: number;
  }[];
}

interface TrendItem {
  productId: string;
  productName: string;
  vendorName: string;
  categoryName: string;
  locationName: string;
  locationCode: string;
  currentQty: number;
  minLevel: number;
  burnRatePerDay: number;
  burnRatePerWeek: number;
  daysUntilReorder: number | null;
  countHistory: { date: string; quantity: number }[];
}

interface CountSession {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  location: { name: string; code: string };
  countedBy: { name: string };
  _count: { counts: number };
}

interface LocationSummary {
  id: string;
  name: string;
  code: string;
  belowPar: number;
  total: number;
  lastCount: string | null;
}

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<"overview" | "reorder" | "trends" | "history">("overview");
  const [loading, setLoading] = useState(true);

  // Overview data
  const [locationSummaries, setLocationSummaries] = useState<LocationSummary[]>([]);

  // Reorder data
  const [reorderData, setReorderData] = useState<{ totalItems: number; totalEstimatedCost: number; vendorGroups: ReorderVendorGroup[] } | null>(null);

  // Trends data
  const [trends, setTrends] = useState<TrendItem[]>([]);

  // History data
  const [sessions, setSessions] = useState<CountSession[]>([]);

  // Load overview on mount
  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/par-levels");
      const data = await res.json();
      const parLevels = data.parLevels || [];
      const locations = data.locations || [];

      // Build location summaries
      const summaries: LocationSummary[] = locations.map((loc: { id: string; name: string; code: string }) => {
        const locItems = parLevels.filter((pl: { location: { id: string } }) => pl.location.id === loc.id);
        const belowPar = locItems.filter((pl: { currentQty: number; minLevel: number }) => pl.currentQty < pl.minLevel).length;
        const lastCountDates = locItems
          .filter((pl: { lastCounted: string | null }) => pl.lastCounted)
          .map((pl: { lastCounted: string }) => new Date(pl.lastCounted).getTime());
        const lastCount = lastCountDates.length > 0 ? new Date(Math.max(...lastCountDates)).toISOString() : null;

        return { id: loc.id, name: loc.name, code: loc.code, belowPar, total: locItems.length, lastCount };
      });

      setLocationSummaries(summaries.filter((s: LocationSummary) => s.total > 0).sort((a: LocationSummary, b: LocationSummary) => b.belowPar - a.belowPar));
    } finally {
      setLoading(false);
    }
  };

  const loadReorder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/reorder");
      const data = await res.json();
      setReorderData(data);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/trends?days=90");
      const data = await res.json();
      setTrends(data.trends || []);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/counts?sessions=true&limit=50");
      const data = await res.json();
      setSessions(data.sessions || []);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    if (newTab === "overview" && locationSummaries.length === 0) loadOverview();
    if (newTab === "reorder" && !reorderData) loadReorder();
    if (newTab === "trends" && trends.length === 0) loadTrends();
    if (newTab === "history" && sessions.length === 0) loadHistory();
  };

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "reorder" as const, label: "Reorder List" },
    { key: "trends" as const, label: "Trends" },
    { key: "history" as const, label: "Count History" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Inventory Management</h1>
          <p className="text-ias-gray-500 text-sm mt-1">Cross-location inventory overview</p>
        </div>
        <Link
          href="/admin/inventory/par-levels"
          className="px-4 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors inline-block text-center"
        >
          Manage Par Levels
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ias-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-ias-charcoal shadow-sm"
                : "text-ias-gray-500 hover:text-ias-charcoal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-ias-gray-400 py-12">Loading...</div>}

      {/* Overview Tab */}
      {!loading && tab === "overview" && (
        <div className="space-y-6">
          {/* Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationSummaries.map((loc) => (
              <Link
                key={loc.id}
                href={`/inventory?locationId=${loc.id}`}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
                  loc.belowPar > 0 ? "border-red-200" : "border-ias-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-ias-charcoal">{loc.name}</h3>
                  <span className="text-xs font-mono text-ias-gray-400">{loc.code}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-ias-gray-500">{loc.total} items</span>
                  </div>
                  {loc.belowPar > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-600 font-medium">{loc.belowPar} below par</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-600">All stocked</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-ias-gray-400 mt-2">
                  Last counted: {loc.lastCount ? new Date(loc.lastCount).toLocaleDateString() : "Never"}
                </div>
              </Link>
            ))}
          </div>
          {locationSummaries.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center text-ias-gray-400 text-sm border border-ias-gray-200">
              No par levels configured yet. Set up par levels to start tracking inventory.
            </div>
          )}
        </div>
      )}

      {/* Reorder List Tab */}
      {!loading && tab === "reorder" && reorderData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-700">{reorderData.totalItems}</div>
              <div className="text-xs text-red-600 mt-1">Items to Reorder</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-ias-gray-200">
              <div className="text-2xl font-bold text-ias-charcoal">{reorderData.vendorGroups.length}</div>
              <div className="text-xs text-ias-gray-500 mt-1">Vendors Affected</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-ias-gray-200">
              <div className="text-2xl font-bold text-ias-charcoal">
                ${reorderData.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-ias-gray-500 mt-1">Estimated Cost</div>
            </div>
          </div>

          {/* Vendor Groups */}
          {reorderData.vendorGroups.map((vg) => (
            <div key={vg.vendorCode} className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
              <div className="bg-ias-gray-50 px-5 py-3 border-b border-ias-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ias-charcoal">{vg.vendorName}</span>
                  <span className="text-xs text-ias-gray-400 ml-2 font-mono">{vg.vendorCode}</span>
                  <span className="text-sm text-ias-gray-500 ml-3">
                    {vg.itemCount} item{vg.itemCount !== 1 ? "s" : ""} ·
                    ${vg.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Link
                  href={`/orders/new?vendorId=${vg.vendorId}`}
                  className="px-3 py-1.5 bg-ias-gold text-ias-charcoal rounded-lg text-xs font-semibold hover:bg-ias-gold/90 transition-colors"
                >
                  Create PO
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ias-gray-100">
                    <th className="text-left px-5 py-2 text-xs font-medium text-ias-gray-500">Product</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-ias-gray-500 hidden sm:table-cell">Location</th>
                    <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500">Current</th>
                    <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500">Par Min</th>
                    <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500">Order Qty</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-ias-gray-500 hidden sm:table-cell">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ias-gray-50">
                  {vg.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ias-gray-50">
                      <td className="px-5 py-2">
                        <span className="text-ias-charcoal">{item.productName}</span>
                      </td>
                      <td className="px-5 py-2 text-ias-gray-500 hidden sm:table-cell">{item.locationName}</td>
                      <td className="px-5 py-2 text-center">
                        <span className="text-red-600 font-medium">{item.currentQty}</span>
                      </td>
                      <td className="px-5 py-2 text-center text-ias-gray-600">{item.minLevel}</td>
                      <td className="px-5 py-2 text-center font-semibold text-ias-charcoal">{item.suggestedQty}</td>
                      <td className="px-5 py-2 text-right text-ias-gray-600 hidden sm:table-cell">
                        ${item.estimatedCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {reorderData.totalItems === 0 && (
            <div className="bg-green-50 rounded-xl p-8 text-center border border-green-200">
              <div className="text-green-700 font-semibold">All items are at or above par levels!</div>
              <p className="text-green-600 text-sm mt-1">No reorders needed at this time.</p>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {!loading && tab === "trends" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Product</th>
                  <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Location</th>
                  <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Current</th>
                  <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Par Min</th>
                  <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Burn/Week</th>
                  <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Days Until Reorder</th>
                  <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden lg:table-cell w-48">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {trends.map((t, idx) => {
                  const maxQty = Math.max(...t.countHistory.map((c) => c.quantity), t.minLevel);
                  return (
                    <tr key={idx} className="hover:bg-ias-gray-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-ias-charcoal">{t.productName}</div>
                        <div className="text-xs text-ias-gray-400">{t.vendorName}</div>
                      </td>
                      <td className="px-5 py-3 text-ias-gray-600 hidden md:table-cell">{t.locationName}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-bold ${t.currentQty < t.minLevel ? "text-red-600" : "text-ias-charcoal"}`}>
                          {t.currentQty}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-ias-gray-600">{t.minLevel}</td>
                      <td className="px-5 py-3 text-center">
                        {t.burnRatePerWeek > 0 ? (
                          <span className="font-medium text-ias-charcoal">{t.burnRatePerWeek}</span>
                        ) : (
                          <span className="text-ias-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {t.daysUntilReorder !== null ? (
                          <span className={`font-semibold ${
                            t.daysUntilReorder <= 0
                              ? "text-red-600"
                              : t.daysUntilReorder <= 7
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}>
                            {t.daysUntilReorder <= 0 ? "Now" : `${t.daysUntilReorder}d`}
                          </span>
                        ) : (
                          <span className="text-ias-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        {/* Mini sparkline using CSS bars */}
                        <div className="flex items-end gap-0.5 h-6">
                          {t.countHistory.slice(-8).map((c, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${
                                c.quantity < t.minLevel ? "bg-red-400" : "bg-ias-gold"
                              }`}
                              style={{ height: `${maxQty > 0 ? (c.quantity / maxQty) * 100 : 0}%`, minHeight: "2px" }}
                              title={`${c.date}: ${c.quantity}`}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {trends.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">
                No count history available yet. Submit inventory counts to see trends.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Count History Tab */}
      {!loading && tab === "history" && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
                <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Location</th>
                <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Counted By</th>
                <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Products</th>
                <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ias-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-ias-gray-50">
                  <td className="px-5 py-3 text-ias-charcoal">
                    {new Date(s.startedAt).toLocaleDateString()}
                    <div className="text-xs text-ias-gray-400">
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ias-charcoal">{s.location.name}</div>
                    <div className="text-xs text-ias-gray-400 font-mono">{s.location.code}</div>
                  </td>
                  <td className="px-5 py-3 text-ias-gray-600 hidden sm:table-cell">{s.countedBy.name}</td>
                  <td className="px-5 py-3 text-center font-medium text-ias-charcoal">{s._count.counts}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      s.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {s.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ias-gray-500 text-xs hidden md:table-cell">
                    {s.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <div className="p-8 text-center text-ias-gray-400 text-sm">
              No count sessions recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
