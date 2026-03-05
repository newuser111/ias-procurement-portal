"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PendingOrder {
  id: string;
  orderNumber: string;
  priority: string;
  totalAmount: number;
  requestedAt: string;
  vendor: { name: string; code: string };
  location: { name: string; code: string };
  requestedBy: { name: string; email: string };
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

const priorityBadge: Record<string, string> = {
  LOW: "bg-ias-gray-100 text-ias-gray-500",
  NORMAL: "bg-ias-gray-100 text-ias-gray-700",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function ApprovalsPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(orderId: string, status: string) {
    setActionLoading(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders(orders.filter((o) => o.id !== orderId));
    }
    setActionLoading(null);
  }

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ias-charcoal">Pending Approvals</h1>
        <p className="text-ias-gray-500 text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} awaiting your review
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-12 text-center">
          <div className="text-ias-gray-400 text-lg">No pending approvals</div>
          <p className="text-ias-gray-400 text-sm mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${order.id}`} className="font-semibold text-ias-blue hover:underline">
                      {order.orderNumber}
                    </Link>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge[order.priority]}`}>
                      {order.priority}
                    </span>
                  </div>
                  <div className="text-sm text-ias-gray-600 mt-1">
                    {order.vendor.name} &middot; {order.location.name}
                  </div>
                  <div className="text-xs text-ias-gray-400 mt-0.5">
                    Requested by {order.requestedBy.name} on{" "}
                    {new Date(order.requestedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-ias-charcoal">${order.totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-ias-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="border-t border-ias-gray-100 px-4 py-2 bg-ias-gray-50">
                <div className="text-xs text-ias-gray-500 space-y-0.5">
                  {order.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <div className="text-ias-gray-400">+{order.items.length - 5} more items</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-ias-gray-200 px-4 py-3 flex gap-2 justify-end">
                <Link
                  href={`/orders/${order.id}`}
                  className="px-3 py-1.5 border border-ias-gray-300 text-ias-gray-600 rounded-lg text-sm hover:bg-ias-gray-50"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleAction(order.id, "REJECTED")}
                  disabled={actionLoading === order.id}
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(order.id, "APPROVED")}
                  disabled={actionLoading === order.id}
                  className="px-3 py-1.5 bg-ias-success text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
