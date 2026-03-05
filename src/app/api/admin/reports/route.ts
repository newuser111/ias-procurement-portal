import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [orders, vendors, locations, categories] = await Promise.all([
    prisma.purchaseOrder.findMany({
      include: {
        vendor: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
        items: { include: { product: { select: { categoryId: true, category: { select: { name: true } } } } } },
      },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Aggregate spend by vendor
  const spendByVendor: Record<string, { name: string; total: number; count: number }> = {};
  // Aggregate spend by location
  const spendByLocation: Record<string, { name: string; total: number; count: number }> = {};
  // Aggregate by month
  const spendByMonth: Record<string, { month: string; total: number; count: number }> = {};

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;

    // By vendor
    const vKey = order.vendor.code;
    if (!spendByVendor[vKey]) spendByVendor[vKey] = { name: order.vendor.name, total: 0, count: 0 };
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
  }

  // Status counts
  type OrderRow = (typeof orders)[number];
  const statusCounts = {
    draft: orders.filter((o: OrderRow) => o.status === "DRAFT").length,
    pending: orders.filter((o: OrderRow) => o.status === "PENDING_APPROVAL").length,
    approved: orders.filter((o: OrderRow) => o.status === "APPROVED").length,
    ordered: orders.filter((o: OrderRow) => o.status === "ORDERED").length,
    shipped: orders.filter((o: OrderRow) => o.status === "SHIPPED").length,
    delivered: orders.filter((o: OrderRow) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o: OrderRow) => o.status === "CANCELLED").length,
  };

  const totalSpend = orders
    .filter((o: OrderRow) => o.status !== "CANCELLED")
    .reduce((sum: number, o: OrderRow) => sum + o.totalAmount, 0);

  return NextResponse.json({
    totalSpend,
    totalOrders: orders.length,
    statusCounts,
    spendByVendor: Object.values(spendByVendor).sort((a, b) => b.total - a.total),
    spendByLocation: Object.values(spendByLocation).sort((a, b) => b.total - a.total),
    spendByMonth: Object.values(spendByMonth).sort((a, b) => a.month.localeCompare(b.month)),
  });
}
