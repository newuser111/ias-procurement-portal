"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  unitOfMeasure: string;
  active: boolean;
  vendor: { id: string; name: string; code: string };
  category: { id: string; name: string } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (vendorFilter) params.set("vendorId", vendorFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/catalog?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products);
        if (data.vendors) setVendors(data.vendors);
        if (data.categories) setCategories(data.categories);
      })
      .finally(() => setLoading(false));
  }, [vendorFilter, categoryFilter, search]);

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ias-charcoal">Products</h1>
        <p className="text-ias-gray-500 text-sm mt-1">{products.length} products in catalog</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          />
        </div>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3 font-medium text-ias-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-ias-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  {p.sku && <div className="text-xs text-ias-gray-400">SKU: {p.sku}</div>}
                </td>
                <td className="px-4 py-3 text-ias-gray-600 hidden sm:table-cell">{p.vendor.name}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.category && (
                    <span className="px-2 py-0.5 bg-ias-gray-100 rounded text-xs text-ias-gray-600">{p.category.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium">${p.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-ias-gray-500 hidden sm:table-cell">{p.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-8 text-center text-ias-gray-400 text-sm">No products found</div>
        )}
      </div>
    </div>
  );
}
