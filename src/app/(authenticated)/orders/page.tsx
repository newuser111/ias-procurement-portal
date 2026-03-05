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
  DRAFT: "bg-ias-gray-100 text-ias-gray-600",
  PENDING_APPROVAL: "bg-ias-gray-100 text-amber-600",
  APPROVED: "bg-ias-gray-100 text-blue-600",
  ORDERED: "bg-ias-gray-100 text-purple-600",
  SHIPPED: "bg-ias-gray-100 text-indigo-600",
  DELIVERED: "bg-ias-gray-100 text-green-600",
  CANCELLED: "bg-ias-gray-100 text-red-600",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const priorityColors: Record<string, string> = {
  LOW: "text-ias-gray-400",
  NORMAL: "text-ias-gray-600",
  HIGH: "text-ias-warning",
  URGENT: "text-ias-danger",
};

export default function OrdersPage() {
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
        o.location.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="text-center text-ias-gray-400 py-12">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ias-charcoal">My Orders</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-ias-charcoal text-white rounded-lg font-medium hover:bg-ias-charcoal-light transition-colors text-sm"
        >
          + New Order
        </Link>
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
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["", "DRAFT", "PENDING_APPROVAL", "APPROVED", "ORDERED", "DELIVERED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-ias-charcoal text-white"
                  : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
              }`}
            >
              {s ? statusLabels[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-ias-gray-400 text-sm">No orders found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
                <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-ias-gray-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ias-gray-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-ias-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="text-ias-blue hover:underline font-medium">
                      {order.orderNumber}
                    </Link>
                    <div className="sm:hidden text-xs text-ias-gray-500">{order.vendor.name}</div>
                  </td>
                  <td className="px-4 py-3 text-ias-gray-700 hidden sm:table-cell">{order.vendor.name}</td>
                  <td className="px-4 py-3 text-ias-gray-700 hidden md:table-cell">{order.location.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
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
        )}
      </div>
    </div>
  );
}
