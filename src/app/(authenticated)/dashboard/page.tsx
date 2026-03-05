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
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="flex items-center gap-2">
            {(data?.belowParCount ?? 0) > 0 && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            <span className={`text-2xl font-bold ${(data?.belowParCount ?? 0) > 0 ? "text-amber-600" : "text-ias-charcoal"}`}>
              {data?.belowParCount ?? 0}
            </span>
          </div>
          <div className="text-xs text-ias-gray-500 mt-1">Below Par</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="flex items-center gap-2">
            {(data?.outOfStockCount ?? 0) > 0 && <span className="w-2 h-2 rounded-full bg-red-400" />}
            <span className={`text-2xl font-bold ${(data?.outOfStockCount ?? 0) > 0 ? "text-red-600" : "text-ias-charcoal"}`}>
              {data?.outOfStockCount ?? 0}
            </span>
          </div>
          <div className="text-xs text-ias-gray-500 mt-1">Out of Stock</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-2xl font-bold text-ias-charcoal">{data?.okCount ?? 0}</span>
          </div>
          <div className="text-xs text-ias-gray-500 mt-1">At / Above Par</div>
        </div>
      </div>

      {/* Pending Approvals Banner */}
      {(isAdmin || isManager) && (data?.pendingApprovals ?? 0) > 0 && (
        <Link
          href="/approvals"
          className="block bg-white border border-ias-gray-200 rounded-xl p-4 hover:border-ias-gold transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <div>
                <span className="font-semibold text-ias-charcoal">
                  {data?.pendingApprovals} order{data?.pendingApprovals !== 1 ? "s" : ""} awaiting approval
                </span>
                <p className="text-xs text-ias-gray-500 mt-0.5">Click to review</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Inventory Alerts */}
      {(data?.inventoryAlerts?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {data?.belowParCount} item{data?.belowParCount !== 1 ? "s" : ""} below par
            </h2>
            <Link href="/inventory" className="text-xs text-ias-gray-500 hover:text-ias-charcoal font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data?.inventoryAlerts.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-ias-charcoal">{a.productName}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-ias-gray-400">{a.vendorName}</span>
                    <span className="text-ias-gray-300">·</span>
                    <span className="text-xs text-ias-gray-400">{a.locationName}</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap flex items-center gap-1.5">
                  <span className={`text-sm font-semibold ${a.currentQty === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {a.currentQty}
                  </span>
                  <span className="text-ias-gray-300">/</span>
                  <span className="text-xs text-ias-gray-500">{a.minLevel}</span>
                </div>
              </div>
            ))}
          </div>
          {(data?.belowParCount ?? 0) > 5 && (
            <Link href="/inventory" className="block text-xs text-ias-gray-500 text-center py-3 border-t border-ias-gray-100 hover:text-ias-charcoal">
              + {(data?.belowParCount ?? 0) - 5} more
            </Link>
          )}
        </div>
      )}

      {/* Locations Needing Count */}
      {(data?.locationsNeedingCount?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {data?.locationsNeedingCount.length} location{data?.locationsNeedingCount.length !== 1 ? "s" : ""} due for count
            </h2>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data?.locationsNeedingCount.map((loc) => (
              <Link
                key={loc.id}
                href="/inventory/count"
                className="flex items-center justify-between px-4 py-3 hover:bg-ias-gray-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-sm text-ias-charcoal">{loc.name}</span>
                  <div className="text-xs text-ias-gray-400 mt-0.5">
                    {loc.lastCounted
                      ? `Last counted ${new Date(loc.lastCounted).toLocaleDateString()}`
                      : "Never counted"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ias-gray-500">{loc.productCount} items</span>
                  <svg className="w-4 h-4 text-ias-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Count Sessions */}
      {(data?.recentCounts?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal text-sm">Recent Counts</h2>
            <Link href="/inventory?tab=history" className="text-xs text-ias-gray-500 hover:text-ias-charcoal font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data?.recentCounts.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-sm text-ias-charcoal">{c.locationName}</div>
                  <div className="text-xs text-ias-gray-400">
                    {new Date(c.startedAt).toLocaleDateString()} · {c.countedBy}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-sm text-ias-gray-600">{c.productsCounted} products</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    c.status === "COMPLETED" ? "bg-green-400" : "bg-amber-400"
                  }`} />
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
          className="bg-white border-2 border-ias-gold rounded-xl p-4 hover:bg-ias-gold/5 transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Count Inventory</div>
          <p className="text-xs text-ias-gray-500 mt-1">Log current stock levels</p>
        </Link>
        <Link
          href="/inventory?tab=reorder"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Reorder List</div>
          <p className="text-xs text-ias-gray-500 mt-1">Items below par level</p>
        </Link>
        {(isAdmin || isPurchaser) && (
          <Link
            href="/admin/inventory/par-levels"
            className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
          >
            <div className="font-semibold text-ias-charcoal">Manage Par Levels</div>
            <p className="text-xs text-ias-gray-500 mt-1">Configure stock thresholds</p>
          </Link>
        )}
        <Link
          href="/catalog"
          className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200 hover:border-ias-gold transition-colors"
        >
          <div className="font-semibold text-ias-charcoal">Browse Catalog</div>
          <p className="text-xs text-ias-gray-500 mt-1">View all products and pricing</p>
        </Link>
      </div>

      {/* Recent Orders (compact, secondary) */}
      {data?.myOrders && data.myOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200">
          <div className="p-4 border-b border-ias-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-ias-charcoal text-sm">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-ias-gray-500 hover:text-ias-charcoal font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-ias-gray-100">
            {data.myOrders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ias-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-xs text-ias-charcoal">{order.orderNumber}</div>
                  <div className="text-xs text-ias-gray-400">{order.vendor.name}</div>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
