"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  totalAmount: number;
  requestedAt: string;
  vendor: { name: string; code: string };
  location: { name: string; code: string };
  requestedBy: { name: string };
  _count: { items: number };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-ias-gray-200 text-ias-gray-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  ORDERED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.vendor.name.toLowerCase().includes(q) ||
        o.location.name.toLowerCase().includes(q) ||
        o.requestedBy.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ias-charcoal">All Orders</h1>

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
            placeholder="Search by PO#, vendor, location, or requester..."
            className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["", "PENDING_APPROVAL", "APPROVED", "ORDERED", "SHIPPED", "DELIVERED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-ias-charcoal text-white" : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
              }`}
            >
              {s ? statusLabels[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Order #</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden lg:table-cell">Requester</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-ias-gray-600">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-ias-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="text-ias-blue hover:underline font-medium">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ias-gray-700">{order.vendor.name}</td>
                <td className="px-4 py-3 text-ias-gray-700 hidden md:table-cell">{order.location.code}</td>
                <td className="px-4 py-3 text-ias-gray-700 hidden lg:table-cell">{order.requestedBy.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">${order.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-ias-gray-500 hidden sm:table-cell">
                  {new Date(order.requestedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-ias-gray-400 text-sm">No orders found</div>
        )}
      </div>
    </div>
  );
}
