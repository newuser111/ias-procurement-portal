"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  unitOfMeasure: string;
  vendor: { id: string; name: string; code: string };
  category: { id: string; name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Product Catalog</h1>
          <p className="text-ias-gray-500 text-sm mt-1">
            {products.length} products available
          </p>
        </div>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-ias-charcoal text-white rounded-lg font-medium hover:bg-ias-charcoal-light transition-colors text-sm"
        >
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold focus:border-transparent"
            />
          </div>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center text-ias-gray-400 py-12">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-ias-gray-400 py-12">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-4 hover:border-ias-gold transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-ias-charcoal truncate">{product.name}</h3>
                  <p className="text-xs text-ias-gray-500 mt-0.5">{product.vendor.name}</p>
                  {product.category && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-ias-gray-100 text-ias-gray-600 rounded text-xs">
                      {product.category.name}
                    </span>
                  )}
                </div>
                <div className="text-right ml-3">
                  <div className="font-semibold text-ias-charcoal">${product.unitPrice}</div>
                  <div className="text-xs text-ias-gray-400">/{product.unitOfMeasure}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
