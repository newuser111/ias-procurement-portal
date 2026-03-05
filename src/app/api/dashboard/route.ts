import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;
  const locationId = session.user.locationId;

  // Scope par levels to user's location unless admin/purchaser
  const plWhere = locationId && role !== "ADMIN" && role !== "PURCHASER" ? { locationId } : {};

  const sessionWhere = locationId && role !== "ADMIN" && role !== "PURCHASER" ? { locationId } : {};

  const [parLevels, recentCountSessions, allCountSessions, myOrders, pendingApprovalsCount] = await Promise.all([
    // All par levels for inventory stats
    prisma.parLevel.findMany({
      where: plWhere,
      include: {
        product: { select: { name: true, vendor: { select: { name: true } } } },
        location: { select: { id: true, name: true, code: true } },
      },
    }),

    // Recent count sessions (for display)
    prisma.inventoryCountSession.findMany({
      where: sessionWhere,
      include: {
        location: { select: { name: true, code: true } },
        countedBy: { select: { name: true } },
        _count: { select: { counts: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),

    // All count sessions (for last-counted-per-location calculation)
    prisma.inventoryCountSession.findMany({
      where: sessionWhere,
      select: { locationId: true, startedAt: true },
      orderBy: { startedAt: "desc" },
      distinct: ["locationId"],
    }),

    // Recent orders (secondary, keep small)
    prisma.purchaseOrder.findMany({
      where: { requestedById: userId },
      include: { vendor: { select: { name: true } } },
      orderBy: { requestedAt: "desc" },
      take: 5,
    }),

    // Pending approvals count
    role === "ADMIN"
      ? prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL" } })
      : role === "MANAGER" && locationId
        ? prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL", locationId } })
        : Promise.resolve(0),
  ]);

  // Inventory KPIs
  const totalTracked = parLevels.length;
  const belowParCount = parLevels.filter((pl) => pl.currentQty < pl.minLevel).length;
  const outOfStockCount = parLevels.filter((pl) => pl.currentQty === 0).length;
  const okCount = parLevels.filter((pl) => pl.currentQty >= pl.minLevel).length;

  // Inventory alerts — worst items first
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

  // Locations needing count (>7 days since last count, or never counted)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Build last-counted-per-location from count sessions
  const lastCountedByLocation = new Map<string, Date>();
  for (const cs of allCountSessions) {
    if (!lastCountedByLocation.has(cs.locationId)) {
      lastCountedByLocation.set(cs.locationId, cs.startedAt);
    }
  }

  // Build location map from par levels
  const locationMap = new Map<string, { id: string; name: string; code: string; total: number }>();
  for (const pl of parLevels) {
    const loc = locationMap.get(pl.location.id);
    if (!loc) {
      locationMap.set(pl.location.id, {
        id: pl.location.id,
        name: pl.location.name,
        code: pl.location.code,
        total: 1,
      });
    } else {
      loc.total++;
    }
  }

  const locationsNeedingCount = Array.from(locationMap.values())
    .map((loc) => ({
      ...loc,
      lastCounted: lastCountedByLocation.get(loc.id) || null,
    }))
    .filter((loc) => !loc.lastCounted || loc.lastCounted < sevenDaysAgo)
    .sort((a, b) => {
      if (!a.lastCounted) return -1;
      if (!b.lastCounted) return 1;
      return a.lastCounted.getTime() - b.lastCounted.getTime();
    })
    .map((loc) => ({
      id: loc.id,
      name: loc.name,
      code: loc.code,
      lastCounted: loc.lastCounted?.toISOString() || null,
      productCount: loc.total,
    }));

  // Format recent count sessions
  const recentCounts = recentCountSessions.map((s) => ({
    id: s.id,
    locationName: s.location.name,
    locationCode: s.location.code,
    countedBy: s.countedBy.name,
    startedAt: s.startedAt.toISOString(),
    productsCounted: s._count.counts,
    status: s.status,
  }));

  return NextResponse.json({
    // Inventory KPIs
    totalTracked,
    belowParCount,
    outOfStockCount,
    okCount,
    inventoryAlerts,
    locationsNeedingCount,
    recentCounts,
    // Orders (secondary)
    myOrders,
    pendingApprovals: pendingApprovalsCount,
  });
}
