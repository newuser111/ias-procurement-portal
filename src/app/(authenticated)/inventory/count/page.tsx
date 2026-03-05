"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const [success, setSuccess] = useState(false);

  const role = session?.user?.role;
  const isAdminOrPurchaser = role === "ADMIN" || role === "PURCHASER";

  // Fetch par levels when location changes
  useEffect(() => {
    if (!locationId) {
      // On first load, fetch to get locations list
      fetch("/api/inventory/par-levels")
        .then((r) => r.json())
        .then((data) => {
          if (data.locations) setLocations(data.locations);
          // If user is location-bound, auto-select their location
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
        // Initialize count entries
        const initial: Record<string, CountEntry> = {};
        for (const pl of data.parLevels || []) {
          initial[pl.productId] = { productId: pl.productId, quantity: "", notes: "" };
        }
        setCounts(initial);
      })
      .finally(() => setLoading(false));
  }, [locationId, isAdminOrPurchaser, session?.user?.locationId]);

  const categories = Array.from(
    new Set(parLevels.map((pl) => pl.product.category?.name).filter(Boolean))
  ).sort() as string[];

  const filteredProducts = categoryFilter
    ? parLevels.filter((pl) => pl.product.category?.name === categoryFilter)
    : parLevels;

  const filledCount = Object.values(counts).filter((c) => c.quantity !== "").length;
  const belowParCount = Object.values(counts).filter((c) => {
    if (c.quantity === "") return false;
    const pl = parLevels.find((p) => p.productId === c.productId);
    return pl && parseInt(c.quantity) < pl.minLevel;
  }).length;

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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Inventory Count</h1>
          <p className="text-ias-gray-500 text-sm mt-1">
            {selectedLocation?.name} — {parLevels.length} products to count
          </p>
        </div>
        {isAdminOrPurchaser && (
          <button
            onClick={() => { setLocationId(""); setCounts({}); }}
            className="text-sm text-ias-gray-500 hover:text-ias-charcoal"
          >
            Change Location
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !categoryFilter
                ? "bg-ias-charcoal text-white"
                : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-ias-charcoal text-white"
                  : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Count Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600">Product</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Vendor</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600">Par Min</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Par Max</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Previous</th>
              <th className="text-center px-5 py-3 font-medium text-ias-gray-600 w-28">Count</th>
              <th className="text-left px-5 py-3 font-medium text-ias-gray-600 hidden lg:table-cell w-40">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {filteredProducts.map((pl) => {
              const entry = counts[pl.productId];
              const qty = entry?.quantity !== "" ? parseInt(entry?.quantity || "0") : null;
              const isBelowPar = qty !== null && qty < pl.minLevel;

              return (
                <tr key={pl.productId} className="hover:bg-ias-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ias-charcoal">{pl.product.name}</div>
                    <div className="text-xs text-ias-gray-400">
                      {pl.product.unitOfMeasure}
                      {pl.product.sku && ` · SKU: ${pl.product.sku}`}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ias-gray-600 hidden md:table-cell">{pl.product.vendor.name}</td>
                  <td className="px-5 py-3 text-center text-ias-gray-600">{pl.minLevel}</td>
                  <td className="px-5 py-3 text-center text-ias-gray-500 hidden sm:table-cell">{pl.maxLevel ?? "—"}</td>
                  <td className="px-5 py-3 text-center text-ias-gray-500 hidden sm:table-cell">{pl.currentQty}</td>
                  <td className="px-5 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={entry?.quantity || ""}
                      onChange={(e) => handleQuantityChange(pl.productId, e.target.value)}
                      placeholder={String(pl.currentQty)}
                      className={`w-20 text-center px-2 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ias-gold ${
                        isBelowPar
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-ias-gray-300"
                      }`}
                    />
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <input
                      type="text"
                      value={entry?.notes || ""}
                      onChange={(e) => handleNotesChange(pl.productId, e.target.value)}
                      placeholder="Optional"
                      className="w-full px-2 py-1.5 border border-ias-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ias-gold"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-ias-gray-400 text-sm">
            No products with par levels at this location
          </div>
        )}
      </div>

      {/* Session Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4">
        <label className="block text-sm font-medium text-ias-gray-600 mb-2">
          Count Session Notes (optional)
        </label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Any notes about this count session..."
          className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold resize-none"
          rows={2}
        />
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ias-gray-200 px-4 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-ias-gray-600">
            <span className="font-semibold text-ias-charcoal">{filledCount}</span> products counted
            {belowParCount > 0 && (
              <span className="ml-3 text-red-600">
                <span className="font-semibold">{belowParCount}</span> below par
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/inventory")}
              className="px-4 py-2 text-sm text-ias-gray-600 hover:text-ias-charcoal"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={filledCount === 0 || submitting}
              className="px-6 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Count"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
