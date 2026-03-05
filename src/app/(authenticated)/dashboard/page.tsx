"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface InventoryAlert {
  productName: string;
  vendorName: string;
  locationName: string;
  locationCode: string;
  currentQty: number;
  minLevel: number;
  deficit: number;
}

interface LocationNeedingCount {
  id: string;
  name: string;
  code: string;
  lastCounted: string | null;
  productCount: number;
}

interface RecentCount {
  id: string;
  locationName: string;
  locationCode: string;
  countedBy: string;
  startedAt: string;
  productsCounted: number;
  status: string;
}

interface DashboardData {
  totalTracked: number;
  belowParCount: number;
  outOfStockCount: number;
  okCount: number;
  inventoryAlerts: InventoryAlert[];
  locationsNeedingCount: LocationNeedingCount[];
  recentCounts: RecentCount[];
  myOrders: {
    id: string;
    orderNumber: string;
    vendor: { name: string };
    status: string;
    totalAmount: number;
    requestedAt: string;
  }[];
  pendingApprovals: number;
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
          href="/inventory/count"
          className="px-4 py-2 bg-ias-gold text-ias-charcoal rounded-lg font-semibold hover:bg-ias-gold/90 transition-colors text-sm"
        >
          Start Count
        </Link>
      </div>

      {/* Inventory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-charcoal">{data?.totalTracked ?? 0}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Products Tracked</div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm border ${
          (data?.belowParCount ?? 0) > 0 ? "bg-red-50 border-red-200" : "bg-white border-ias-gray-200"
        }`}>
          <div className={`text-2xl font-bold ${(data?.belowParCount ?? 0) > 0 ? "text-red-700" : "text-ias-charcoal"}`}>
            {data?.belowParCount ?? 0}
          </div>
          <div className={`text-xs mt-1 ${(data?.belowParCount ?? 0) > 0 ? "text-red-600" : "text-ias-gray-500"}`}>
            Below Par
          </div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm border ${
          (data?.outOfStockCount ?? 0) > 0 ? "bg-red-50 border-red-200" : "bg-white border-ias-gray-200"
        }`}>
          <div className={`text-2xl font-bold ${(data?.outOfStockCount ?? 0) > 0 ? "text-red-700" : "text-ias-charcoal"}`}>
            {data?.outOfStockCount ?? 0}
          </div>
          <div className={`text-xs mt-1 ${(data?.outOfStockCount ?? 0) > 0 ? "text-red-600" : "text-ias-gray-500"}`}>
            Out of Stock
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-green-600">{data?.okCount ?? 0}</div>
          <div className="text-xs text-ias-gray-500 mt-1">At / Above Par</div>
        </div>
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

      {/* Inventory Alerts */}
      {(data?.inventoryAlerts?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-red-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {data?.belowParCount} item{data?.belowParCount !== 1 ? "s" : ""} below par level
            </h2>
            <Link href="/inventory" className="text-sm text-red-700 hover:text-red-900 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {data?.inventoryAlerts.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-red-900">{a.productName}</span>
                  <span className="text-red-600 ml-2 text-xs">{a.vendorName}</span>
                  <span className="text-red-500 ml-2 text-xs">@ {a.locationName}</span>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className={`font-bold ${a.currentQty === 0 ? "text-red-700" : "text-red-600"}`}>
                    {a.currentQty}
                  </span>
                  <span className="text-red-400 mx-1">/</span>
                  <span className="text-red-500">{a.minLevel} min</span>
                </div>
              </div>
            ))}
            {(data?.belowParCount ?? 0) > 5 && (
              <Link href="/inventory" className="block text-xs text-red-600 text-center pt-1 hover:text-red-800">
                + {(data?.belowParCount ?? 0) - 5} more items below par
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Locations Needing Count */}
      {(data?.locationsNeedingCount?.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {data?.locationsNeedingCount.length} location{data?.locationsNeedingCount.length !== 1 ? "s" : ""} due for count
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data?.locationsNeedingCount.map((loc) => (
              <Link
                key={loc.id}
                href="/inventory/count"
                className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 text-sm hover:bg-white transition-colors"
              >
                <div>
                  <span className="font-medium text-amber-900">{loc.name}</span>
                  <div className="text-xs text-amber-600 mt-0.5">
                    {loc.lastCounted
                      ? `Last: ${new Date(loc.lastCounted).toLocaleDateString()}`
                      : "Never counted"}
                  </div>
                </div>
                <span className="text-xs text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">
                  {loc.productCount} items
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Count Sessions */}
      {(data?.recentCounts?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal">Recent Counts</h2>
            <Link href="/inventory?tab=history" className="text-sm text-ias-blue hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data?.recentCounts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-sm text-ias-charcoal">{c.locationName}</div>
                  <div className="text-xs text-ias-gray-500">
                    {new Date(c.startedAt).toLocaleDateString()} · {c.countedBy}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-ias-charcoal">{c.productsCounted} products</span>
                  <div className="mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/inventory/count"
          className="bg-ias-gold/10 border-2 border-ias-gold rounded-xl p-4 hover:bg-ias-gold/20 transition-colors"
        >
          <div className="text-lg font-semibold text-ias-charcoal">Count Inventory</div>
          <p className="text-xs text-ias-gray-500 mt-1">Log current stock levels</p>
        </Link>
        <Link
          href="/inventory?tab=reorder"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="text-lg font-semibold text-ias-charcoal">Reorder List</div>
          <p className="text-xs text-ias-gray-500 mt-1">Items below par level</p>
        </Link>
        {(isAdmin || isPurchaser) && (
          <Link
            href="/admin/inventory/par-levels"
            className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
          >
            <div className="text-lg font-semibold text-ias-charcoal">Manage Par Levels</div>
            <p className="text-xs text-ias-gray-500 mt-1">Configure stock thresholds</p>
          </Link>
        )}
        <Link
          href="/catalog"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="text-lg font-semibold text-ias-charcoal">Browse Catalog</div>
          <p className="text-xs text-ias-gray-500 mt-1">View all products and pricing</p>
        </Link>
      </div>

      {/* Recent Orders (compact, secondary) */}
      {data?.myOrders && data.myOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal text-sm">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-ias-blue hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data.myOrders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 hover:bg-ias-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-xs text-ias-charcoal">{order.orderNumber}</div>
                  <div className="text-xs text-ias-gray-400">{order.vendor.name}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
