"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReportData {
  totalSpend: number;
  totalOrders: number;
  activeOrders: number;
  avgOrderSize: number;
  avgApprovalHours: number;
  vendorCount: number;
  locationCount: number;
  productCount: number;
  statusCounts: Record<string, number>;
  spendByVendor: { name: string; total: number; count: number; avgOrderSize: number }[];
  spendByLocation: { name: string; total: number; count: number }[];
  spendByMonth: { month: string; total: number; count: number }[];
  spendByCategory: { name: string; total: number; itemCount: number }[];
  topProducts: { name: string; vendor: string; quantity: number; totalSpend: number }[];
  recentOrders: { id: string; orderNumber: string; vendor: string; location: string; status: string; total: number; date: string; requestedBy: string }[];
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-ias-gray-100 text-ias-gray-600",
  PENDING_APPROVAL: "bg-ias-gray-100 text-amber-600",
  APPROVED: "bg-ias-gray-100 text-blue-600",
  ORDERED: "bg-ias-gray-100 text-indigo-600",
  SHIPPED: "bg-ias-gray-100 text-purple-600",
  DELIVERED: "bg-ias-gray-100 text-green-600",
  CANCELLED: "bg-ias-gray-100 text-red-600",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "vendor" | "location" | "category" | "products">("overview");

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;
  if (!data) return null;

  const maxVendorSpend = Math.max(...data.spendByVendor.map((v) => v.total), 1);
  const maxLocationSpend = Math.max(...data.spendByLocation.map((l) => l.total), 1);
  const maxCategorySpend = Math.max(...data.spendByCategory.map((c) => c.total), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ias-charcoal">Reports & Analytics</h1>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-xs text-ias-gray-500 uppercase tracking-wider">Total Spend</div>
          <div className="text-2xl font-bold text-ias-charcoal mt-1">${data.totalSpend.toLocaleString()}</div>
          <div className="text-xs text-ias-gray-400 mt-1">{data.activeOrders} active orders</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-xs text-ias-gray-500 uppercase tracking-wider">Avg Order Size</div>
          <div className="text-2xl font-bold text-ias-charcoal mt-1">${data.avgOrderSize.toLocaleString()}</div>
          <div className="text-xs text-ias-gray-400 mt-1">across {data.totalOrders} total orders</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-xs text-ias-gray-500 uppercase tracking-wider">Avg Approval Time</div>
          <div className="text-2xl font-bold text-ias-charcoal mt-1">{data.avgApprovalHours}h</div>
          <div className="text-xs text-ias-gray-400 mt-1">request to approval</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-xs text-ias-gray-500 uppercase tracking-wider">Pending Approval</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{data.statusCounts.pending || 0}</div>
          <div className="text-xs text-ias-gray-400 mt-1">{data.statusCounts.draft || 0} drafts in queue</div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 text-center">
          <div className="text-2xl font-bold text-ias-charcoal">{data.vendorCount}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Active Vendors</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 text-center">
          <div className="text-2xl font-bold text-ias-charcoal">{data.locationCount}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Locations</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 text-center">
          <div className="text-2xl font-bold text-ias-charcoal">{data.productCount}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Products in Catalog</div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5">
        <h2 className="text-sm font-semibold text-ias-charcoal mb-3">Order Pipeline</h2>
        <div className="flex items-center gap-1 overflow-x-auto">
          {(["draft", "pending", "approved", "ordered", "shipped", "delivered"] as const).map((status) => {
            const count = data.statusCounts[status] || 0;
            const statusKey = status === "pending" ? "PENDING_APPROVAL" : status.toUpperCase();
            return (
              <div key={status} className="flex-1 min-w-[80px]">
                <div className="text-center">
                  <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium ${statusColor[statusKey]}`}>
                    {count}
                  </div>
                  <div className="text-[10px] text-ias-gray-500 mt-1 capitalize">{statusLabel[statusKey]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 overflow-x-auto">
        {([
          ["overview", "Overview"],
          ["vendor", "By Vendor"],
          ["location", "By Location"],
          ["category", "By Category"],
          ["products", "Top Products"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? "bg-ias-charcoal text-white" : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        {/* Overview — Monthly trend + recent orders */}
        {tab === "overview" && (
          <div>
            <div className="p-5 border-b border-ias-gray-200">
              <h3 className="text-sm font-semibold text-ias-charcoal mb-3">Monthly Spend Trend</h3>
              {data.spendByMonth.length === 0 ? (
                <div className="text-sm text-ias-gray-400 text-center py-4">No monthly data yet</div>
              ) : (
                <div className="space-y-2">
                  {data.spendByMonth.map((m) => {
                    const maxMonthSpend = Math.max(...data.spendByMonth.map((x) => x.total), 1);
                    return (
                      <div key={m.month} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-ias-gray-600 font-medium">{m.month}</div>
                        <div className="flex-1 h-7 bg-ias-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ias-gold rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max((m.total / maxMonthSpend) * 100, 8)}%` }}
                          >
                            <span className="text-[10px] font-semibold text-ias-charcoal">${m.total.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-16 text-right text-xs text-ias-gray-400">{m.count} orders</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="text-sm font-semibold text-ias-charcoal mb-3">Recent Activity</h3>
              {data.recentOrders.length === 0 ? (
                <div className="text-sm text-ias-gray-400 text-center py-4">No orders yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-ias-gray-500 border-b border-ias-gray-100">
                      <th className="text-left pb-2 font-medium">Order</th>
                      <th className="text-left pb-2 font-medium hidden sm:table-cell">Vendor</th>
                      <th className="text-left pb-2 font-medium hidden md:table-cell">Location</th>
                      <th className="text-center pb-2 font-medium">Status</th>
                      <th className="text-right pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ias-gray-100">
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-ias-gray-50">
                        <td className="py-2.5">
                          <Link href={`/orders/${o.id}`} className="text-ias-blue hover:underline font-medium">
                            {o.orderNumber}
                          </Link>
                          <div className="text-[10px] text-ias-gray-400">{new Date(o.date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-2.5 text-ias-gray-600 hidden sm:table-cell">{o.vendor}</td>
                        <td className="py-2.5 text-ias-gray-600 hidden md:table-cell">{o.location}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColor[o.status]}`}>
                            {statusLabel[o.status]}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-medium">${o.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* By Vendor */}
        {tab === "vendor" && (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200 text-xs text-ias-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Vendor</th>
                  <th className="text-right px-5 py-3 font-medium">Total Spend</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Orders</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Avg Order</th>
                  <th className="px-5 py-3 font-medium w-48 hidden md:table-cell">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {data.spendByVendor.map((v) => (
                  <tr key={v.name} className="hover:bg-ias-gray-50">
                    <td className="px-5 py-3 font-medium text-ias-charcoal">{v.name}</td>
                    <td className="px-5 py-3 text-right font-semibold">${v.total.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-ias-gray-600 hidden sm:table-cell">{v.count}</td>
                    <td className="px-5 py-3 text-right text-ias-gray-600 hidden sm:table-cell">${v.avgOrderSize.toLocaleString()}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="h-4 bg-ias-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-ias-gold rounded-full" style={{ width: `${(v.total / maxVendorSpend) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.spendByVendor.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No vendor data yet</div>
            )}
          </div>
        )}

        {/* By Location */}
        {tab === "location" && (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200 text-xs text-ias-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Location</th>
                  <th className="text-right px-5 py-3 font-medium">Total Spend</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Orders</th>
                  <th className="px-5 py-3 font-medium w-48 hidden md:table-cell">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {data.spendByLocation.map((l) => (
                  <tr key={l.name} className="hover:bg-ias-gray-50">
                    <td className="px-5 py-3 font-medium text-ias-charcoal">{l.name}</td>
                    <td className="px-5 py-3 text-right font-semibold">${l.total.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-ias-gray-600 hidden sm:table-cell">{l.count}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="h-4 bg-ias-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-ias-blue rounded-full" style={{ width: `${(l.total / maxLocationSpend) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.spendByLocation.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No location data yet</div>
            )}
          </div>
        )}

        {/* By Category */}
        {tab === "category" && (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200 text-xs text-ias-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-right px-5 py-3 font-medium">Total Spend</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Items Ordered</th>
                  <th className="px-5 py-3 font-medium w-48 hidden md:table-cell">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {data.spendByCategory.map((c) => (
                  <tr key={c.name} className="hover:bg-ias-gray-50">
                    <td className="px-5 py-3 font-medium text-ias-charcoal">{c.name}</td>
                    <td className="px-5 py-3 text-right font-semibold">${c.total.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-ias-gray-600 hidden sm:table-cell">{c.itemCount}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="h-4 bg-ias-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(c.total / maxCategorySpend) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.spendByCategory.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No category data yet</div>
            )}
          </div>
        )}

        {/* Top Products */}
        {tab === "products" && (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200 text-xs text-ias-gray-500">
                  <th className="text-left px-5 py-3 font-medium">#</th>
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Vendor</th>
                  <th className="text-right px-5 py-3 font-medium">Qty Ordered</th>
                  <th className="text-right px-5 py-3 font-medium">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {data.topProducts.map((p, i) => (
                  <tr key={p.name} className="hover:bg-ias-gray-50">
                    <td className="px-5 py-3 text-ias-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-ias-charcoal">{p.name}</td>
                    <td className="px-5 py-3 text-ias-gray-600 hidden sm:table-cell">{p.vendor}</td>
                    <td className="px-5 py-3 text-right text-ias-gray-600">{p.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold">${p.totalSpend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.topProducts.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No product data yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
