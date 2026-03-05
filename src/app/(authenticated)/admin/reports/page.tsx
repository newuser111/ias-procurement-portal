"use client";

import { useEffect, useState } from "react";

interface ReportData {
  totalSpend: number;
  totalOrders: number;
  statusCounts: Record<string, number>;
  spendByVendor: { name: string; total: number; count: number }[];
  spendByLocation: { name: string; total: number; count: number }[];
  spendByMonth: { month: string; total: number; count: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"vendor" | "location" | "month">("vendor");

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ias-charcoal">Spend Reports</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-charcoal">${data.totalSpend.toLocaleString()}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Total Spend</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-charcoal">{data.totalOrders}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-success">{data.statusCounts.delivered || 0}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Delivered</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ias-gray-200">
          <div className="text-2xl font-bold text-ias-warning">{data.statusCounts.pending || 0}</div>
          <div className="text-xs text-ias-gray-500 mt-1">Pending Approval</div>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5">
        {([["vendor", "By Vendor"], ["location", "By Location"], ["month", "By Month"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === key ? "bg-ias-charcoal text-white" : "bg-ias-gray-100 text-ias-gray-600 hover:bg-ias-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        {tab === "vendor" && (
          <div className="divide-y divide-ias-gray-100">
            {data.spendByVendor.map((v) => (
              <div key={v.name} className="p-4 flex items-center gap-4">
                <div className="w-40 truncate font-medium text-sm">{v.name}</div>
                <div className="flex-1">
                  <div className="h-6 bg-ias-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ias-gold rounded-full"
                      style={{ width: `${(v.total / maxVendorSpend) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right">
                  <div className="font-semibold text-sm">${v.total.toLocaleString()}</div>
                  <div className="text-xs text-ias-gray-400">{v.count} orders</div>
                </div>
              </div>
            ))}
            {data.spendByVendor.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No data yet</div>
            )}
          </div>
        )}

        {tab === "location" && (
          <div className="divide-y divide-ias-gray-100">
            {data.spendByLocation.map((l) => (
              <div key={l.name} className="p-4 flex items-center gap-4">
                <div className="w-48 truncate font-medium text-sm">{l.name}</div>
                <div className="flex-1">
                  <div className="h-6 bg-ias-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ias-blue rounded-full"
                      style={{ width: `${(l.total / maxLocationSpend) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right">
                  <div className="font-semibold text-sm">${l.total.toLocaleString()}</div>
                  <div className="text-xs text-ias-gray-400">{l.count} orders</div>
                </div>
              </div>
            ))}
            {data.spendByLocation.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No data yet</div>
            )}
          </div>
        )}

        {tab === "month" && (
          <div className="divide-y divide-ias-gray-100">
            {data.spendByMonth.map((m) => (
              <div key={m.month} className="p-4 flex items-center justify-between">
                <div className="font-medium text-sm">{m.month}</div>
                <div className="text-right">
                  <div className="font-semibold text-sm">${m.total.toLocaleString()}</div>
                  <div className="text-xs text-ias-gray-400">{m.count} orders</div>
                </div>
              </div>
            ))}
            {data.spendByMonth.length === 0 && (
              <div className="p-8 text-center text-ias-gray-400 text-sm">No data yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
