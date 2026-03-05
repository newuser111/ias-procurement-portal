"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  unitOfMeasure: string;
  productType: "CONSUMABLE" | "RETAIL" | "BOTH";
  subCategory: string | null;
  vendor: { id: string; name: string; code: string };
  category: { id: string; name: string } | null;
}

type TypeFilter = "" | "CONSUMABLE" | "RETAIL" | "BOTH";

const typeBadge = (type: string) => {
  switch (type) {
    case "CONSUMABLE":
      return "bg-ias-gray-100 text-blue-600";
    case "RETAIL":
      return "bg-ias-gray-100 text-green-600";
    case "BOTH":
      return "bg-ias-gray-100 text-purple-600";
    default:
      return "bg-ias-gray-100 text-ias-gray-600";
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case "CONSUMABLE": return "Consumable";
    case "RETAIL": return "Retail";
    case "BOTH": return "Both";
    default: return type;
  }
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [openVendors, setOpenVendors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, []);

  // Filter products by search + type
  const filtered = products.filter((p) => {
    if (typeFilter && p.productType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.vendor.name.toLowerCase().includes(q) ||
      (p.category?.name || "").toLowerCase().includes(q) ||
      (p.subCategory || "").toLowerCase().includes(q)
    );
  });

  // Count by type
  const consumableCount = products.filter((p) => p.productType === "CONSUMABLE").length;
  const retailCount = products.filter((p) => p.productType === "RETAIL").length;
  const bothCount = products.filter((p) => p.productType === "BOTH").length;

  // Group by vendor
  const grouped = filtered.reduce<Record<string, { vendor: { id: string; name: string; code: string }; products: Product[] }>>((acc, p) => {
    const key = p.vendor.code;
    if (!acc[key]) acc[key] = { vendor: p.vendor, products: [] };
    acc[key].products.push(p);
    return acc;
  }, {});

  const sortedVendors = Object.values(grouped).sort((a, b) => a.vendor.name.localeCompare(b.vendor.name));

  function toggleVendor(code: string) {
    setOpenVendors((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function expandAll() {
    setOpenVendors(new Set(sortedVendors.map((g) => g.vendor.code)));
  }

  function collapseAll() {
    setOpenVendors(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Product Catalog</h1>
          <p className="text-ias-gray-500 text-sm mt-1">
            {filtered.length} products across {sortedVendors.length} vendors
          </p>
        </div>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-ias-charcoal text-white rounded-lg font-medium hover:bg-ias-charcoal-light transition-colors text-sm"
        >
          + New Order
        </Link>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !typeFilter
              ? "bg-ias-charcoal text-white"
              : "bg-white border border-ias-gray-300 text-ias-gray-600 hover:bg-ias-gray-50"
          }`}
        >
          All ({products.length})
        </button>
        <button
          onClick={() => setTypeFilter("CONSUMABLE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter === "CONSUMABLE"
              ? "bg-blue-600 text-white"
              : "bg-white border border-ias-gray-300 text-ias-gray-600 hover:bg-ias-gray-50"
          }`}
        >
          Consumable ({consumableCount})
        </button>
        <button
          onClick={() => setTypeFilter("RETAIL")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter === "RETAIL"
              ? "bg-green-600 text-white"
              : "bg-white border border-ias-gray-300 text-ias-gray-600 hover:bg-ias-gray-50"
          }`}
        >
          Retail ({retailCount})
        </button>
        <button
          onClick={() => setTypeFilter("BOTH")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter === "BOTH"
              ? "bg-purple-600 text-white"
              : "bg-white border border-ias-gray-300 text-ias-gray-600 hover:bg-ias-gray-50"
          }`}
        >
          Both ({bothCount})
        </button>
      </div>

      {/* Search + Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, vendors, categories, or subcategories..."
              className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={expandAll} className="px-3 py-1.5 text-ias-gray-600 hover:text-ias-charcoal border border-ias-gray-300 rounded-lg">
              Expand All
            </button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-ias-gray-600 hover:text-ias-charcoal border border-ias-gray-300 rounded-lg">
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      {loading ? (
        <div className="text-center text-ias-gray-400 py-12">Loading catalog...</div>
      ) : sortedVendors.length === 0 ? (
        <div className="text-center text-ias-gray-400 py-12">No products found</div>
      ) : (
        <div className="space-y-2">
          {sortedVendors.map(({ vendor, products: vendorProducts }) => {
            const isOpen = openVendors.has(vendor.code);
            const bySubCategory = vendorProducts.reduce<Record<string, Product[]>>((acc, p) => {
              const sub = p.subCategory || p.category?.name || "Uncategorized";
              if (!acc[sub]) acc[sub] = [];
              acc[sub].push(p);
              return acc;
            }, {});

            return (
              <div key={vendor.code} className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleVendor(vendor.code)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-ias-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-ias-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold text-ias-charcoal">{vendor.name}</div>
                      <div className="text-xs text-ias-gray-400 mt-0.5">{vendor.code}</div>
                    </div>
                  </div>
                  <span className="text-xs text-ias-gray-500 bg-ias-gray-100 px-2.5 py-1 rounded-full">
                    {vendorProducts.length} product{vendorProducts.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-ias-gray-200">
                    {Object.entries(bySubCategory).sort(([a], [b]) => a.localeCompare(b)).map(([subCat, catProducts]) => (
                      <div key={subCat}>
                        <div className="px-5 py-2 bg-ias-gray-50 text-xs font-medium text-ias-gray-500 uppercase tracking-wider">
                          {subCat}
                        </div>
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-ias-gray-100">
                            {catProducts.sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                              <tr key={p.id} className="hover:bg-ias-gray-50">
                                <td className="pl-12 pr-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-ias-charcoal">{p.name}</span>
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge(p.productType)}`}>
                                      {typeLabel(p.productType)}
                                    </span>
                                  </div>
                                  {p.sku && (
                                    <div className="text-[10px] text-ias-gray-400 mt-0.5">SKU: {p.sku}</div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right text-ias-gray-600 whitespace-nowrap">
                                  {p.unitPrice > 0 ? (
                                    <>
                                      <span className="font-semibold">${p.unitPrice.toFixed(2)}</span>
                                      <span className="text-ias-gray-400 text-xs ml-1">/ {p.unitOfMeasure}</span>
                                    </>
                                  ) : (
                                    <span className="text-ias-gray-300 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
