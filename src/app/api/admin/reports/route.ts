import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [orders, vendorCount, locationCount, productCount] = await Promise.all([
    prisma.purchaseOrder.findMany({
      include: {
        vendor: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
        items: {
          include: {
            product: { select: { categoryId: true, category: { select: { name: true } } } },
          },
        },
        requestedBy: { select: { name: true } },
      },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.vendor.count({ where: { active: true } }),
    prisma.location.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true } }),
  ]);

  type OrderRow = (typeof orders)[number];
  type ItemRow = OrderRow["items"][number];

  const activeOrders = orders.filter((o: OrderRow) => o.status !== "CANCELLED");

  // Spend by vendor
  const spendByVendor: Record<string, { name: string; total: number; count: number; avgOrderSize: number }> = {};
  // Spend by location
  const spendByLocation: Record<string, { name: string; total: number; count: number }> = {};
  // Spend by month
  const spendByMonth: Record<string, { month: string; total: number; count: number }> = {};
  // Spend by category
  const spendByCategory: Record<string, { name: string; total: number; itemCount: number }> = {};
  // Top products by quantity
  const productVolume: Record<string, { name: string; vendor: string; quantity: number; totalSpend: number }> = {};
  // Approval cycle times
  const approvalTimes: number[] = [];

  for (const order of activeOrders) {
    // By vendor
    const vKey = order.vendor.code;
    if (!spendByVendor[vKey]) spendByVendor[vKey] = { name: order.vendor.name, total: 0, count: 0, avgOrderSize: 0 };
    spendByVendor[vKey].total += order.totalAmount;
    spendByVendor[vKey].count++;

    // By location
    const lKey = order.location.code;
    if (!spendByLocation[lKey]) spendByLocation[lKey] = { name: order.location.name, total: 0, count: 0 };
    spendByLocation[lKey].total += order.totalAmount;
    spendByLocation[lKey].count++;

    // By month
    const d = new Date(order.requestedAt);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!spendByMonth[mKey]) spendByMonth[mKey] = { month: mKey, total: 0, count: 0 };
    spendByMonth[mKey].total += order.totalAmount;
    spendByMonth[mKey].count++;

    // By category (from line items)
    for (const item of order.items) {
      const catName = (item as ItemRow).product?.category?.name || "Uncategorized";
      if (!spendByCategory[catName]) spendByCategory[catName] = { name: catName, total: 0, itemCount: 0 };
      spendByCategory[catName].total += item.totalPrice;
      spendByCategory[catName].itemCount += item.quantity;

      // Product volume
      const pKey = item.name;
      if (!productVolume[pKey]) productVolume[pKey] = { name: item.name, vendor: order.vendor.name, quantity: 0, totalSpend: 0 };
      productVolume[pKey].quantity += item.quantity;
      productVolume[pKey].totalSpend += item.totalPrice;
    }

    // Approval cycle time
    if (order.requestedAt && order.approvedAt) {
      const diff = new Date(order.approvedAt).getTime() - new Date(order.requestedAt).getTime();
      approvalTimes.push(diff / (1000 * 60 * 60)); // hours
    }
  }

  // Calculate avg order sizes
  for (const v of Object.values(spendByVendor)) {
    v.avgOrderSize = v.count > 0 ? Math.round(v.total / v.count) : 0;
  }

  // Status counts
  const statusCounts = {
    draft: orders.filter((o: OrderRow) => o.status === "DRAFT").length,
    pending: orders.filter((o: OrderRow) => o.status === "PENDING_APPROVAL").length,
    approved: orders.filter((o: OrderRow) => o.status === "APPROVED").length,
    ordered: orders.filter((o: OrderRow) => o.status === "ORDERED").length,
    shipped: orders.filter((o: OrderRow) => o.status === "SHIPPED").length,
    delivered: orders.filter((o: OrderRow) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o: OrderRow) => o.status === "CANCELLED").length,
  };

  const totalSpend = activeOrders.reduce((sum: number, o: OrderRow) => sum + o.totalAmount, 0);
  const avgApprovalHours = approvalTimes.length > 0 ? Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length) : 0;

  // Recent activity (last 10 orders)
  const recentOrders = orders.slice(0, 10).map((o: OrderRow) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    vendor: o.vendor.name,
    location: o.location.name,
    status: o.status,
    total: o.totalAmount,
    date: o.requestedAt,
    requestedBy: o.requestedBy.name,
  }));

  return NextResponse.json({
    totalSpend,
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    avgOrderSize: activeOrders.length > 0 ? Math.round(totalSpend / activeOrders.length) : 0,
    avgApprovalHours,
    vendorCount,
    locationCount,
    productCount,
    statusCounts,
    spendByVendor: Object.values(spendByVendor).sort((a, b) => b.total - a.total),
    spendByLocation: Object.values(spendByLocation).sort((a, b) => b.total - a.total),
    spendByMonth: Object.values(spendByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    spendByCategory: Object.values(spendByCategory).sort((a, b) => b.total - a.total),
    topProducts: Object.values(productVolume).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 15),
    recentOrders,
  });
}
