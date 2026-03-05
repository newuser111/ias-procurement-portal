"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ParLevelItem {
  id: string;
  productId: string;
  locationId: string;
  minLevel: number;
  maxLevel: number | null;
  currentQty: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unitOfMeasure: string;
    vendor: { id: string; name: string; code: string };
    category: { id: string; name: string } | null;
  };
  location: { id: string; name: string; code: string };
}

interface CountEntry {
  productId: string;
  quantity: string;
  notes: string;
  showNotes: boolean;
}

export default function InventoryCountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [parLevels, setParLevels] = useState<ParLevelItem[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [counts, setCounts] = useState<Record<string, CountEntry>>({});
  const [sessionNotes, setSessionNotes] = useState("");
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const role = session?.user?.role;
  const isAdminOrPurchaser = role === "ADMIN" || role === "PURCHASER";

  useEffect(() => {
    if (!locationId) {
      fetch("/api/inventory/par-levels")
        .then((r) => r.json())
        .then((data) => {
          if (data.locations) setLocations(data.locations);
          if (!isAdminOrPurchaser && session?.user?.locationId) {
            setLocationId(session.user.locationId);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    fetch(`/api/inventory/par-levels?locationId=${locationId}`)
      .then((r) => r.json())
      .then((data) => {
        setParLevels(data.parLevels || []);
        if (data.locations) setLocations(data.locations);
        const initial: Record<string, CountEntry> = {};
        for (const pl of data.parLevels || []) {
          initial[pl.productId] = { productId: pl.productId, quantity: "", notes: "", showNotes: false };
        }
        setCounts(initial);
      })
      .finally(() => setLoading(false));
  }, [locationId, isAdminOrPurchaser, session?.user?.locationId]);

  const categories = Array.from(
    new Set(parLevels.map((pl) => pl.product.category?.name).filter(Boolean))
  ).sort() as string[];

  const filteredProducts = parLevels
    .filter((pl) => !categoryFilter || pl.product.category?.name === categoryFilter)
    .filter((pl) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        pl.product.name.toLowerCase().includes(s) ||
        pl.product.vendor.name.toLowerCase().includes(s) ||
        (pl.product.sku && pl.product.sku.toLowerCase().includes(s))
      );
    });

  const filledCount = Object.values(counts).filter((c) => c.quantity !== "").length;
  const totalCount = parLevels.length;
  const belowParCount = Object.values(counts).filter((c) => {
    if (c.quantity === "") return false;
    const pl = parLevels.find((p) => p.productId === c.productId);
    return pl && parseInt(c.quantity) < pl.minLevel;
  }).length;
  const progressPct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  const handleQuantityChange = (productId: string, value: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], quantity: value },
    }));
  };

  const handleNotesChange = (productId: string, value: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], notes: value },
    }));
  };

  const toggleNotes = (productId: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], showNotes: !prev[productId]?.showNotes },
    }));
  };

  const handleSubmit = async () => {
    const filledCounts = Object.values(counts)
      .filter((c) => c.quantity !== "")
      .map((c) => ({
        productId: c.productId,
        quantity: parseInt(c.quantity),
        notes: c.notes || undefined,
      }));

    if (filledCounts.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          counts: filledCounts,
          sessionNotes: sessionNotes || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/inventory"), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ias-charcoal">Count Submitted!</h2>
          <p className="text-ias-gray-500 text-sm mt-1">
            {filledCount} products counted. Redirecting to inventory...
          </p>
        </div>
      </div>
    );
  }

  if (loading && !locationId) {
    return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;
  }

  // Location selection step
  if (!locationId) {
    return (
      <div className="space-y-6">
        <Link href="/inventory" className="inline-flex items-center text-sm text-ias-gray-500 hover:text-ias-charcoal transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Inventory Count</h1>
          <p className="text-ias-gray-500 text-sm mt-1">Select a location to begin counting</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setLocationId(loc.id)}
              className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold hover:shadow-md transition-all text-left"
            >
              <div className="font-semibold text-ias-charcoal">{loc.name}</div>
              <div className="text-xs text-ias-gray-400 font-mono mt-1">{loc.code}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading products...</div>;

  const selectedLocation = locations.find((l) => l.id === locationId);

  return (
    <div className="space-y-4 pb-28">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/inventory" className="inline-flex items-center text-sm text-ias-gray-500 hover:text-ias-charcoal transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        {isAdminOrPurchaser && (
          <button
            onClick={() => { setLocationId(""); setCounts({}); setSearch(""); setCategoryFilter(""); }}
            className="text-xs text-ias-gray-500 hover:text-ias-charcoal transition-colors"
          >
            Change Location
          </button>
        )}
      </div>

      {/* Header with progress */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-ias-charcoal">{selectedLocation?.name}</h1>
            <p className="text-xs text-ias-gray-400">{parLevels.length} products to count</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ias-charcoal">{progressPct}%</div>
            <div className="text-xs text-ias-gray-400">{filledCount}/{totalCount}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-ias-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressPct === 100 ? "#22c55e" : "#ddc67b",
            }}
          />
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-ias-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          />
        </div>
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-ias-gray-200 rounded-xl text-sm text-ias-gray-600 focus:outline-none focus:ring-2 focus:ring-ias-gold"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((pl) => {
          const entry = counts[pl.productId];
          const qty = entry?.quantity !== "" ? parseInt(entry?.quantity || "0") : null;
          const isBelowPar = qty !== null && qty < pl.minLevel;
          const isCounted = entry?.quantity !== "";

          return (
            <div
              key={pl.productId}
              className={`bg-white rounded-xl border transition-all ${
                isBelowPar
                  ? "border-red-200 shadow-sm"
                  : isCounted
                    ? "border-green-200 shadow-sm"
                    : "border-ias-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Status indicator */}
                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
                  isBelowPar ? "bg-red-400" : isCounted ? "bg-green-400" : "bg-ias-gray-200"
                }`} />

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ias-charcoal truncate">{pl.product.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-ias-gray-400">{pl.product.vendor.name}</span>
                    <span className="text-ias-gray-300">·</span>
                    <span className="text-xs text-ias-gray-400">{pl.product.unitOfMeasure}</span>
                    {pl.product.sku && (
                      <>
                        <span className="text-ias-gray-300">·</span>
                        <span className="text-xs text-ias-gray-400 font-mono">{pl.product.sku}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-ias-gray-400">
                      Par: <span className="font-medium text-ias-gray-600">{pl.minLevel}</span>
                      {pl.maxLevel !== null && <span> – {pl.maxLevel}</span>}
                    </span>
                    <span className="text-xs text-ias-gray-400">
                      Previous: <span className="font-medium text-ias-gray-600">{pl.currentQty}</span>
                    </span>
                  </div>
                </div>

                {/* Count input */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <input
                    ref={(el) => { inputRefs.current[pl.productId] = el; }}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={entry?.quantity || ""}
                    onChange={(e) => handleQuantityChange(pl.productId, e.target.value)}
                    placeholder="—"
                    className={`w-16 h-10 text-center text-base font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ias-gold transition-colors ${
                      isBelowPar
                        ? "border-red-300 bg-red-50 text-red-700"
                        : isCounted
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-ias-gray-300 bg-white text-ias-charcoal"
                    }`}
                  />
                  {/* Notes toggle */}
                  <button
                    onClick={() => toggleNotes(pl.productId)}
                    className={`text-xs transition-colors ${
                      entry?.notes ? "text-ias-gold font-medium" : "text-ias-gray-400 hover:text-ias-gray-600"
                    }`}
                  >
                    {entry?.showNotes ? "hide" : entry?.notes ? "note ✎" : "+ note"}
                  </button>
                </div>
              </div>

              {/* Expandable notes */}
              {entry?.showNotes && (
                <div className="px-3 pb-3 pl-7">
                  <input
                    type="text"
                    value={entry?.notes || ""}
                    onChange={(e) => handleNotesChange(pl.productId, e.target.value)}
                    placeholder="Add a note for this item..."
                    className="w-full px-3 py-2 border border-ias-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ias-gold bg-ias-gray-50"
                    autoFocus
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl border border-ias-gray-200 p-8 text-center text-ias-gray-400 text-sm">
          {search ? "No products match your search" : "No products with par levels at this location"}
        </div>
      )}

      {/* Session Notes Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <button
          onClick={() => setShowSessionNotes(!showSessionNotes)}
          className="w-full flex items-center justify-between p-3 text-sm text-ias-gray-600 hover:bg-ias-gray-50 transition-colors"
        >
          <span className="font-medium">Session Notes</span>
          <svg
            className={`w-4 h-4 transition-transform ${showSessionNotes ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showSessionNotes && (
          <div className="px-3 pb-3">
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="General notes about this count session..."
              className="w-full px-3 py-2 border border-ias-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold resize-none bg-ias-gray-50"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-ias-gray-200 px-4 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-ias-charcoal">{filledCount}</span>
            <span className="text-ias-gray-500">/{totalCount} counted</span>
            {belowParCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {belowParCount} below par
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/inventory")}
              className="px-4 py-2 text-sm text-ias-gray-500 hover:text-ias-charcoal"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={filledCount === 0 || submitting}
              className="px-5 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : `Submit (${filledCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
