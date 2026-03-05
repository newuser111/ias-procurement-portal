"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LocationSummary {
  id: string;
  name: string;
  code: string;
  belowPar: number;
  total: number;
  lastCount: string | null;
}

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [locationSummaries, setLocationSummaries] = useState<LocationSummary[]>([]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Inventory Settings</h1>
          <p className="text-ias-gray-500 text-sm mt-1">Configure par levels and manage locations</p>
        </div>
        <Link
          href="/admin/inventory/par-levels"
          className="px-4 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors inline-block text-center"
        >
          Manage Par Levels
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/inventory/par-levels"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Par Level Configuration</div>
          <p className="text-xs text-ias-gray-500 mt-1">Set min/max stock thresholds per product per location</p>
        </Link>
        <Link
          href="/inventory?tab=reorder"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Reorder List</div>
          <p className="text-xs text-ias-gray-500 mt-1">View items below par and suggested order quantities</p>
        </Link>
        <Link
          href="/inventory?tab=trends"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Burn Rate Trends</div>
          <p className="text-xs text-ias-gray-500 mt-1">Consumption analytics and days-until-reorder forecasts</p>
        </Link>
      </div>

      {/* Location Overview */}
      <div>
        <h2 className="text-lg font-semibold text-ias-charcoal mb-3">Location Overview</h2>
        {loading ? (
          <div className="text-center text-ias-gray-400 py-12">Loading...</div>
        ) : (
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
        )}
        {!loading && locationSummaries.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-ias-gray-400 text-sm border border-ias-gray-200">
            No par levels configured yet. Set up par levels to start tracking inventory.
          </div>
        )}
      </div>
    </div>
  );
}
