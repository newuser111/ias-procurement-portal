"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  totalAmount: number;
  notes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  orderedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  vendor: { name: string; code: string; contactEmail: string | null; contactPhone: string | null };
  location: { name: string; code: string };
  requestedBy: { id: string; name: string; email: string };
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
  }[];
  approvals: {
    id: string;
    action: string;
    notes: string | null;
    createdAt: string;
    user: { name: string; email: string };
  }[];
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
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showReject, setShowReject] = useState(false);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPurchaser = role === "PURCHASER";

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string, notes?: string) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      setShowReject(false);
    }
    setActionLoading(false);
  }

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;
  if (!order) return <div className="text-center text-ias-gray-400 py-12">Order not found</div>;

  // Timeline events
  const timeline = [
    { label: "Requested", date: order.requestedAt, by: order.requestedBy.name },
    ...(order.approvedAt ? [{ label: "Approved", date: order.approvedAt, by: order.approvals.find((a) => a.action === "APPROVED")?.user.name || "" }] : []),
    ...(order.orderedAt ? [{ label: "Ordered", date: order.orderedAt, by: "Purchasing" }] : []),
    ...(order.shippedAt ? [{ label: "Shipped", date: order.shippedAt, by: "" }] : []),
    ...(order.deliveredAt ? [{ label: "Delivered", date: order.deliveredAt, by: "" }] : []),
    ...(order.cancelledAt ? [{ label: "Cancelled", date: order.cancelledAt, by: order.approvals.find((a) => a.action === "REJECTED")?.user.name || "" }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-sm text-ias-gray-500 hover:text-ias-gray-700">&larr; Back to Orders</Link>
          <h1 className="text-2xl font-bold text-ias-charcoal mt-1">{order.orderNumber}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-ias-gray-500">Vendor</div>
                <div className="font-medium mt-0.5">{order.vendor.name}</div>
              </div>
              <div>
                <div className="text-ias-gray-500">Location</div>
                <div className="font-medium mt-0.5">{order.location.name}</div>
              </div>
              <div>
                <div className="text-ias-gray-500">Requested By</div>
                <div className="font-medium mt-0.5">{order.requestedBy.name}</div>
              </div>
              <div>
                <div className="text-ias-gray-500">Priority</div>
                <div className="font-medium mt-0.5 capitalize">{order.priority.toLowerCase()}</div>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-ias-gray-200">
                <div className="text-ias-gray-500 text-sm">Notes</div>
                <div className="text-sm mt-0.5">{order.notes}</div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
            <div className="p-4 border-b border-ias-gray-200">
              <h2 className="font-semibold text-ias-charcoal">Line Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-ias-gray-600">Item</th>
                  <th className="text-right px-4 py-2 font-medium text-ias-gray-600">Qty</th>
                  <th className="text-right px-4 py-2 font-medium text-ias-gray-600">Unit Price</th>
                  <th className="text-right px-4 py-2 font-medium text-ias-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ias-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.notes && <div className="text-xs text-ias-gray-500">{item.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ias-gray-200 bg-ias-gray-50">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">${order.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {order.status === "DRAFT" && (
              <button
                onClick={() => updateStatus("PENDING_APPROVAL")}
                disabled={actionLoading}
                className="px-4 py-2 bg-ias-charcoal text-white rounded-lg text-sm font-medium hover:bg-ias-charcoal-light disabled:opacity-50"
              >
                Submit for Approval
              </button>
            )}

            {order.status === "PENDING_APPROVAL" && (isAdmin || isManager) && (
              <>
                <button
                  onClick={() => updateStatus("APPROVED")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-ias-success text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-ias-danger text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {order.status === "APPROVED" && (isAdmin || isPurchaser) && (
              <button
                onClick={() => updateStatus("ORDERED")}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                Mark as Ordered
              </button>
            )}

            {order.status === "ORDERED" && (isAdmin || isPurchaser) && (
              <>
                <button
                  onClick={() => updateStatus("SHIPPED")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Mark as Shipped
                </button>
                <button
                  onClick={() => updateStatus("DELIVERED")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-ias-success text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              </>
            )}

            {order.status === "SHIPPED" && (
              <button
                onClick={() => updateStatus("DELIVERED")}
                disabled={actionLoading}
                className="px-4 py-2 bg-ias-success text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                Mark as Delivered
              </button>
            )}

            {!["DELIVERED", "CANCELLED"].includes(order.status) && (
              <button
                onClick={() => updateStatus("CANCELLED")}
                disabled={actionLoading}
                className="px-4 py-2 border border-ias-gray-300 text-ias-gray-600 rounded-lg text-sm font-medium hover:bg-ias-gray-50 disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>

          {/* Reject Modal */}
          {showReject && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 mb-2">Reject Order</h3>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => updateStatus("REJECTED", rejectNotes)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-ias-danger text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 border border-ias-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5">
            <h2 className="font-semibold text-ias-charcoal mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-ias-gold mt-1"></div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-ias-gray-200 mt-1"></div>}
                  </div>
                  <div className="pb-4">
                    <div className="font-medium text-sm">{event.label}</div>
                    <div className="text-xs text-ias-gray-500">
                      {new Date(event.date).toLocaleString()}
                    </div>
                    {event.by && <div className="text-xs text-ias-gray-400">{event.by}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval History */}
          {order.approvals.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5">
              <h2 className="font-semibold text-ias-charcoal mb-3">Approval History</h2>
              <div className="space-y-3">
                {order.approvals.map((a) => (
                  <div key={a.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        a.action === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {a.action}
                      </span>
                      <span className="text-ias-gray-600">{a.user.name}</span>
                    </div>
                    {a.notes && <p className="text-xs text-ias-gray-500 mt-1">{a.notes}</p>}
                    <p className="text-xs text-ias-gray-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Contact */}
          <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5">
            <h2 className="font-semibold text-ias-charcoal mb-2">Vendor Contact</h2>
            <div className="text-sm text-ias-gray-600">
              <div className="font-medium">{order.vendor.name}</div>
              {order.vendor.contactEmail && <div className="mt-1">{order.vendor.contactEmail}</div>}
              {order.vendor.contactPhone && <div>{order.vendor.contactPhone}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
