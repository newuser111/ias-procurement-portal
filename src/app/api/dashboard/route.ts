import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;
  const locationId = session.user.locationId;

  // My recent orders (all roles see their own)
  const myOrders = await prisma.purchaseOrder.findMany({
    where: { requestedById: userId },
    include: { vendor: { select: { name: true } } },
    orderBy: { requestedAt: "desc" },
    take: 10,
  });

  // Pending approvals count (for managers/admins)
  let pendingApprovals = 0;
  if (role === "ADMIN") {
    pendingApprovals = await prisma.purchaseOrder.count({
      where: { status: "PENDING_APPROVAL" },
    });
  } else if (role === "MANAGER" && locationId) {
    pendingApprovals = await prisma.purchaseOrder.count({
      where: { status: "PENDING_APPROVAL", locationId },
    });
  }

  // Order stats for current user
  const where = role === "ADMIN" || role === "PURCHASER" ? {} : { requestedById: userId };
  const [draft, pending, approved, ordered, delivered] = await Promise.all([
    prisma.purchaseOrder.count({ where: { ...where, status: "DRAFT" } }),
    prisma.purchaseOrder.count({ where: { ...where, status: "PENDING_APPROVAL" } }),
    prisma.purchaseOrder.count({ where: { ...where, status: "APPROVED" } }),
    prisma.purchaseOrder.count({ where: { ...where, status: "ORDERED" } }),
    prisma.purchaseOrder.count({ where: { ...where, status: "DELIVERED" } }),
  ]);

  // Inventory alerts — items below par level
  const parLevels = await prisma.parLevel.findMany({
    where: locationId && role !== "ADMIN" ? { locationId } : {},
    include: {
      product: { select: { name: true, vendor: { select: { name: true } } } },
      location: { select: { name: true, code: true } },
    },
  });
  const inventoryAlerts = parLevels
    .filter((pl) => pl.currentQty < pl.minLevel)
    .sort((a, b) => (a.currentQty - a.minLevel) - (b.currentQty - b.minLevel))
    .slice(0, 10)
    .map((pl) => ({
      productName: pl.product.name,
      vendorName: pl.product.vendor.name,
      locationName: pl.location.name,
      locationCode: pl.location.code,
      currentQty: pl.currentQty,
      minLevel: pl.minLevel,
      deficit: pl.minLevel - pl.currentQty,
    }));
  const belowParCount = parLevels.filter((pl) => pl.currentQty < pl.minLevel).length;

  return NextResponse.json({
    myOrders,
    pendingApprovals,
    stats: { draft, pending, approved, ordered, delivered },
    inventoryAlerts,
    belowParCount,
  });
}
