"use client";

import { useEffect, useState } from "react";

interface ParLevelItem {
  id: string;
  productId: string;
  locationId: string;
  minLevel: number;
  maxLevel: number | null;
  currentQty: number;
  status: string;
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

interface EditableParLevel {
  productId: string;
  locationId: string;
  minLevel: number;
  maxLevel: number | null;
  originalMin: number;
  originalMax: number | null;
}

interface ProductOption {
  id: string;
  name: string;
  productType: string;
  vendor: { name: string };
  category: { name: string } | null;
}

export default function ParLevelsPage() {
  const [parLevels, setParLevels] = useState<ParLevelItem[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [edits, setEdits] = useState<Record<string, EditableParLevel>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Products without par levels at this location
  const [unsetProducts, setUnsetProducts] = useState<ProductOption[]>([]);
  const [showAddProducts, setShowAddProducts] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (locationId) params.set("locationId", locationId);

    fetch(`/api/inventory/par-levels?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setParLevels(data.parLevels || []);
        if (data.locations) setLocations(data.locations);
        if (data.categories) setCategories(data.categories);

        // Initialize edits map
        const editMap: Record<string, EditableParLevel> = {};
        for (const pl of data.parLevels || []) {
          editMap[`${pl.productId}-${pl.locationId}`] = {
            productId: pl.productId,
            locationId: pl.locationId,
            minLevel: pl.minLevel,
            maxLevel: pl.maxLevel,
            originalMin: pl.minLevel,
            originalMax: pl.maxLevel,
          };
        }
        setEdits(editMap);
        setHasChanges(false);
      })
      .finally(() => setLoading(false));
  }, [locationId]);

  // Load products without par levels when location is selected
  useEffect(() => {
    if (!locationId) {
      setUnsetProducts([]);
      return;
    }

    fetch(`/api/catalog`)
      .then((r) => r.json())
      .then((data) => {
        const allProducts = data.products || [];
        const trackedIds = new Set(parLevels.filter((pl) => pl.locationId === locationId).map((pl) => pl.productId));
        // Only show consumable/both products (retail products don't need par levels)
        const unset = allProducts.filter((p: ProductOption) => !trackedIds.has(p.id) && p.productType !== "RETAIL");
        setUnsetProducts(unset);
      });
  }, [locationId, parLevels]);

  const handleMinChange = (key: string, value: string) => {
    setEdits((prev) => {
      const updated = { ...prev, [key]: { ...prev[key], minLevel: parseInt(value) || 0 } };
      checkChanges(updated);
      return updated;
    });
  };

  const handleMaxChange = (key: string, value: string) => {
    setEdits((prev) => {
      const val = value === "" ? null : parseInt(value) || 0;
      const updated = { ...prev, [key]: { ...prev[key], maxLevel: val } };
      checkChanges(updated);
      return updated;
    });
  };

  const checkChanges = (editMap: Record<string, EditableParLevel>) => {
    const changed = Object.values(editMap).some(
      (e) => e.minLevel !== e.originalMin || e.maxLevel !== e.originalMax
    );
    setHasChanges(changed);
  };

  const handleAddProduct = async (productId: string) => {
    if (!locationId) return;

    try {
      const res = await fetch("/api/inventory/par-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locationId, minLevel: 0, maxLevel: null }),
      });

      if (res.ok) {
        // Refresh data
        setLoading(true);
        const params = new URLSearchParams();
        params.set("locationId", locationId);
        const data = await fetch(`/api/inventory/par-levels?${params}`).then((r) => r.json());
        setParLevels(data.parLevels || []);
        const editMap: Record<string, EditableParLevel> = {};
        for (const pl of data.parLevels || []) {
          editMap[`${pl.productId}-${pl.locationId}`] = {
            productId: pl.productId,
            locationId: pl.locationId,
            minLevel: pl.minLevel,
            maxLevel: pl.maxLevel,
            originalMin: pl.minLevel,
            originalMax: pl.maxLevel,
          };
        }
        setEdits(editMap);
        setLoading(false);
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    const changed = Object.values(edits).filter(
      (e) => e.minLevel !== e.originalMin || e.maxLevel !== e.originalMax
    );

    if (changed.length === 0) return;

    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/inventory/par-levels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parLevels: changed.map((e) => ({
            productId: e.productId,
            locationId: e.locationId,
            minLevel: e.minLevel,
            maxLevel: e.maxLevel,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveMessage(`Saved ${data.updated} par level${data.updated !== 1 ? "s" : ""}`);
        // Update originals
        setEdits((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(updated)) {
            updated[key] = {
              ...updated[key],
              originalMin: updated[key].minLevel,
              originalMax: updated[key].maxLevel,
            };
          }
          return updated;
        });
        setHasChanges(false);
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const grouped = new Map<string, ParLevelItem[]>();
  const filtered = categoryFilter
    ? parLevels.filter((pl) => pl.product.category?.id === categoryFilter)
    : parLevels;

  for (const pl of filtered) {
    const cat = pl.product.category?.name || "Uncategorized";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(pl);
  }

  if (loading && !locationId) {
    return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ias-charcoal">Par Level Management</h1>
        <p className="text-ias-gray-500 text-sm mt-1">
          Set minimum and maximum stock levels for each product at each location
        </p>
      </div>

      {/* Location Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={locationId}
          onChange={(e) => { setLocationId(e.target.value); setLoading(true); setEdits({}); setHasChanges(false); }}
          className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm font-medium"
        >
          <option value="">Select a Location</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
          ))}
        </select>
        {locationId && (
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
        )}
      </div>

      {!locationId && (
        <div className="bg-white rounded-xl p-8 text-center text-ias-gray-400 text-sm border border-ias-gray-200">
          Select a location to manage par levels
        </div>
      )}

      {loading && locationId && <div className="text-center text-ias-gray-400 py-12">Loading...</div>}

      {/* Par Levels Table grouped by category */}
      {!loading && locationId && Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
          <div className="bg-ias-gray-50 px-5 py-3 border-b border-ias-gray-200">
            <h3 className="font-semibold text-ias-charcoal text-sm">{category}</h3>
            <span className="text-xs text-ias-gray-400">{items.length} products</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ias-gray-100">
                <th className="text-left px-5 py-2 text-xs font-medium text-ias-gray-500">Product</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-ias-gray-500 hidden md:table-cell">Vendor</th>
                <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500 w-24">Min Level</th>
                <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500 w-24">Max Level</th>
                <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500">Current</th>
                <th className="text-center px-5 py-2 text-xs font-medium text-ias-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ias-gray-50">
              {items.map((pl) => {
                const key = `${pl.productId}-${pl.locationId}`;
                const edit = edits[key];
                const isChanged = edit && (edit.minLevel !== edit.originalMin || edit.maxLevel !== edit.originalMax);

                return (
                  <tr key={pl.id} className={`hover:bg-ias-gray-50 ${isChanged ? "bg-ias-gold/5" : ""}`}>
                    <td className="px-5 py-2">
                      <div className="font-medium text-ias-charcoal">{pl.product.name}</div>
                      {pl.product.sku && <div className="text-xs text-ias-gray-400">SKU: {pl.product.sku}</div>}
                    </td>
                    <td className="px-5 py-2 text-ias-gray-600 hidden md:table-cell">{pl.product.vendor.name}</td>
                    <td className="px-5 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={edit?.minLevel ?? pl.minLevel}
                        onChange={(e) => handleMinChange(key, e.target.value)}
                        className="w-16 text-center px-1 py-1 border border-ias-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
                      />
                    </td>
                    <td className="px-5 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={edit?.maxLevel ?? pl.maxLevel ?? ""}
                        onChange={(e) => handleMaxChange(key, e.target.value)}
                        placeholder="—"
                        className="w-16 text-center px-1 py-1 border border-ias-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
                      />
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className={`font-bold ${pl.currentQty < pl.minLevel ? "text-red-600" : "text-ias-charcoal"}`}>
                        {pl.currentQty}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className="flex items-center justify-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pl.status === "OUT" ? "bg-red-400" : pl.status === "LOW" ? "bg-amber-400" : "bg-green-400"
                        }`} />
                        <span className={`text-xs font-medium ${
                          pl.status === "OUT" ? "text-red-600" : pl.status === "LOW" ? "text-amber-600" : "text-ias-gray-600"
                        }`}>
                          {pl.status === "OUT" ? "Out" : pl.status === "LOW" ? "Low" : "OK"}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* Products without par levels */}
      {!loading && locationId && unsetProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
          <button
            onClick={() => setShowAddProducts(!showAddProducts)}
            className="w-full bg-ias-gray-50 px-5 py-3 border-b border-ias-gray-200 flex items-center justify-between hover:bg-ias-gray-100 transition-colors"
          >
            <span className="font-semibold text-ias-charcoal text-sm">
              Products Without Par Levels ({unsetProducts.length})
            </span>
            <svg className={`w-4 h-4 text-ias-gray-400 transition-transform ${showAddProducts ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAddProducts && (
            <div className="divide-y divide-ias-gray-50 max-h-80 overflow-y-auto">
              {unsetProducts.map((p) => (
                <div key={p.id} className="px-5 py-2 flex items-center justify-between hover:bg-ias-gray-50">
                  <div>
                    <span className="text-sm text-ias-charcoal">{p.name}</span>
                    <span className="text-xs text-ias-gray-400 ml-2">{p.vendor.name}</span>
                  </div>
                  <button
                    onClick={() => handleAddProduct(p.id)}
                    className="text-xs px-2 py-1 bg-ias-gray-100 rounded hover:bg-ias-gray-200 text-ias-gray-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ias-gray-200 px-4 py-3 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-ias-gray-600">
              {saveMessage ? (
                <span className="text-green-600 font-medium">{saveMessage}</span>
              ) : (
                <span>You have unsaved changes</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Reset edits to originals
                  setEdits((prev) => {
                    const reset = { ...prev };
                    for (const key of Object.keys(reset)) {
                      reset[key] = { ...reset[key], minLevel: reset[key].originalMin, maxLevel: reset[key].originalMax };
                    }
                    return reset;
                  });
                  setHasChanges(false);
                }}
                className="px-4 py-2 text-sm text-ias-gray-600 hover:text-ias-charcoal"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-ias-gold text-ias-charcoal rounded-lg text-sm font-semibold hover:bg-ias-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
