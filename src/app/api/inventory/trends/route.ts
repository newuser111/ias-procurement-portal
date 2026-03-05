import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const productId = searchParams.get("productId");
  const days = parseInt(searchParams.get("days") || "90");

  // Scope to user's location unless admin/purchaser
  const effectiveLocationId =
    role === "ADMIN" || role === "PURCHASER"
      ? locationId || undefined
      : session.user.locationId || undefined;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const where: Record<string, unknown> = {
    countedAt: { gte: sinceDate },
  };
  if (effectiveLocationId) where.locationId = effectiveLocationId;
  if (productId) where.productId = productId;

  // Get all counts in the time window
  const counts = await prisma.inventoryCount.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          vendor: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
      location: { select: { id: true, name: true, code: true } },
    },
    orderBy: { countedAt: "asc" },
  });

  // Get current par levels for context
  const parWhere: Record<string, unknown> = {};
  if (effectiveLocationId) parWhere.locationId = effectiveLocationId;
  if (productId) parWhere.productId = productId;

  const parLevels = await prisma.parLevel.findMany({
    where: parWhere,
    select: { productId: true, locationId: true, minLevel: true, maxLevel: true, currentQty: true },
  });

  const parMap = new Map<string, { minLevel: number; maxLevel: number | null; currentQty: number }>();
  for (const pl of parLevels) {
    parMap.set(`${pl.productId}-${pl.locationId}`, pl);
  }

  // Group counts by product-location pair
  const grouped = new Map<
    string,
    {
      productId: string;
      productName: string;
      vendorName: string;
      categoryName: string;
      locationId: string;
      locationName: string;
      locationCode: string;
      counts: { date: Date; quantity: number }[];
    }
  >();

  for (const c of counts) {
    const key = `${c.productId}-${c.locationId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        productId: c.product.id,
        productName: c.product.name,
        vendorName: c.product.vendor.name,
        categoryName: c.product.category?.name || "Uncategorized",
        locationId: c.location.id,
        locationName: c.location.name,
        locationCode: c.location.code,
        counts: [],
      });
    }
    grouped.get(key)!.counts.push({ date: c.countedAt, quantity: c.quantity });
  }

  // Calculate burn rates for each product-location pair
  const trends = Array.from(grouped.values()).map((g) => {
    const sortedCounts = g.counts.sort((a, b) => a.date.getTime() - b.date.getTime());
    const burnRates: number[] = [];

    for (let i = 1; i < sortedCounts.length; i++) {
      const prev = sortedCounts[i - 1];
      const curr = sortedCounts[i];
      const usage = prev.quantity - curr.quantity;

      // Only count consumption periods (positive usage = stock went down)
      if (usage > 0) {
        const daysBetween =
          (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysBetween > 0) {
          burnRates.push(usage / daysBetween);
        }
      }
    }

    const avgDailyBurnRate =
      burnRates.length > 0
        ? burnRates.reduce((a, b) => a + b, 0) / burnRates.length
        : 0;

    const par = parMap.get(`${g.productId}-${g.locationId}`);
    const currentQty = par?.currentQty ?? (sortedCounts.length > 0 ? sortedCounts[sortedCounts.length - 1].quantity : 0);
    const minLevel = par?.minLevel ?? 0;

    const daysUntilReorder =
      avgDailyBurnRate > 0 && currentQty > minLevel
        ? Math.round((currentQty - minLevel) / avgDailyBurnRate)
        : avgDailyBurnRate > 0
          ? 0
          : null; // null = not enough data

    return {
      productId: g.productId,
      productName: g.productName,
      vendorName: g.vendorName,
      categoryName: g.categoryName,
      locationId: g.locationId,
      locationName: g.locationName,
      locationCode: g.locationCode,
      currentQty,
      minLevel,
      maxLevel: par?.maxLevel ?? null,
      burnRatePerDay: Math.round(avgDailyBurnRate * 100) / 100,
      burnRatePerWeek: Math.round(avgDailyBurnRate * 7 * 100) / 100,
      daysUntilReorder,
      countHistory: sortedCounts.map((c) => ({
        date: c.date.toISOString().split("T")[0],
        quantity: c.quantity,
      })),
    };
  });

  // Sort by urgency (daysUntilReorder ascending, nulls last)
  trends.sort((a, b) => {
    if (a.daysUntilReorder === null && b.daysUntilReorder === null) return 0;
    if (a.daysUntilReorder === null) return 1;
    if (b.daysUntilReorder === null) return -1;
    return a.daysUntilReorder - b.daysUntilReorder;
  });

  return NextResponse.json({ trends, days });
}
