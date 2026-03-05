"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  myOrders: {
    id: string;
    orderNumber: string;
    vendor: { name: string };
    status: string;
    totalAmount: number;
    requestedAt: string;
  }[];
  pendingApprovals: number;
  stats: {
    draft: number;
    pending: number;
    approved: number;
    ordered: number;
    delivered: number;
  };
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPurchaser = role === "PURCHASER";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-ias-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ias-charcoal">Dashboard</h1>
          <p className="text-ias-gray-500 text-sm mt-1">
            Welcome back, {session?.user?.name}
            {session?.user?.locationName && ` — ${session.user.locationName}`}
          </p>
        </div>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-ias-charcoal text-white rounded-lg font-medium hover:bg-ias-charcoal-light transition-colors text-sm"
        >
          + New Order
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Drafts", count: data?.stats.draft ?? 0, color: "text-ias-gray-600" },
          { label: "Pending", count: data?.stats.pending ?? 0, color: "text-ias-warning" },
          { label: "Approved", count: data?.stats.approved ?? 0, color: "text-ias-blue" },
          { label: "Ordered", count: data?.stats.ordered ?? 0, color: "text-purple-600" },
          { label: "Delivered", count: data?.stats.delivered ?? 0, color: "text-ias-success" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className="text-xs text-ias-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Banner */}
      {(isAdmin || isManager) && (data?.pendingApprovals ?? 0) > 0 && (
        <Link
          href="/approvals"
          className="block bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-yellow-800">
                {data?.pendingApprovals} order{data?.pendingApprovals !== 1 ? "s" : ""} awaiting your approval
              </span>
              <p className="text-sm text-yellow-700 mt-0.5">Click to review and approve</p>
            </div>
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
        <div className="p-4 border-b border-ias-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-ias-charcoal">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-ias-blue hover:underline">
            View All
          </Link>
        </div>
        {data?.myOrders && data.myOrders.length > 0 ? (
          <div className="divide-y divide-ias-gray-100">
            {data.myOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-ias-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{order.orderNumber}</div>
                  <div className="text-xs text-ias-gray-500">{order.vendor.name}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <div className="text-xs text-ias-gray-500 mt-1">
                    ${order.totalAmount.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-ias-gray-400 text-sm">
            No orders yet.{" "}
            <Link href="/orders/new" className="text-ias-blue hover:underline">
              Create your first order
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/catalog"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="text-lg font-semibold text-ias-charcoal">Browse Catalog</div>
          <p className="text-xs text-ias-gray-500 mt-1">Find products and create orders</p>
        </Link>
        <Link
          href="/orders"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="text-lg font-semibold text-ias-charcoal">My Orders</div>
          <p className="text-xs text-ias-gray-500 mt-1">Track your purchase orders</p>
        </Link>
        {(isAdmin || isPurchaser) && (
          <Link
            href="/admin/reports"
            className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
          >
            <div className="text-lg font-semibold text-ias-charcoal">Spend Reports</div>
            <p className="text-xs text-ias-gray-500 mt-1">View spend analytics</p>
          </Link>
        )}
      </div>
    </div>
  );
}
