import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const categoryId = searchParams.get("categoryId");
  const vendorId = searchParams.get("vendorId");
  const belowPar = searchParams.get("belowPar") === "true";

  const role = session.user.role;
  const userLocationId = session.user.locationId;

  // Employees/managers only see their own location
  const effectiveLocationId =
    role === "ADMIN" || role === "PURCHASER"
      ? locationId || undefined
      : userLocationId || undefined;

  const where: Record<string, unknown> = {};
  if (effectiveLocationId) where.locationId = effectiveLocationId;
  if (categoryId) where.product = { categoryId };
  if (vendorId) where.product = { ...((where.product as Record<string, unknown>) || {}), vendorId };

  const parLevels = await prisma.parLevel.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unitPrice: true,
          unitOfMeasure: true,
          productType: true,
          subCategory: true,
          vendor: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
        },
      },
      location: { select: { id: true, name: true, code: true } },
    },
    orderBy: { product: { name: "asc" } },
  });

  // Get last count date per par level
  const parLevelIds = parLevels.map((pl) => ({ productId: pl.productId, locationId: pl.locationId }));
  const lastCounts = await prisma.inventoryCount.findMany({
    where: {
      OR: parLevelIds.length > 0 ? parLevelIds : [{ productId: "none" }],
    },
    orderBy: { countedAt: "desc" },
    distinct: ["productId", "locationId"],
    select: { productId: true, locationId: true, countedAt: true },
  });

  const lastCountMap = new Map<string, Date>();
  for (const c of lastCounts) {
    lastCountMap.set(`${c.productId}-${c.locationId}`, c.countedAt);
  }

  const result = parLevels
    .map((pl) => ({
      id: pl.id,
      productId: pl.productId,
      locationId: pl.locationId,
      minLevel: pl.minLevel,
      maxLevel: pl.maxLevel,
      currentQty: pl.currentQty,
      product: pl.product,
      location: pl.location,
      lastCounted: lastCountMap.get(`${pl.productId}-${pl.locationId}`) || null,
      status:
        pl.currentQty === 0
          ? "OUT"
          : pl.currentQty < pl.minLevel
            ? "LOW"
            : "OK",
    }))
    .filter((pl) => (belowPar ? pl.currentQty < pl.minLevel : true));

  // Also fetch locations and categories for filter dropdowns
  const [locations, categories, vendors] = await Promise.all([
    prisma.location.findMany({ where: { active: true }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ parLevels: result, locations, categories, vendors });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PURCHASER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { productId, locationId, minLevel, maxLevel } = body;

  if (!productId || !locationId || minLevel === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parLevel = await prisma.parLevel.upsert({
    where: { productId_locationId: { productId, locationId } },
    update: { minLevel, maxLevel: maxLevel ?? null },
    create: { productId, locationId, minLevel, maxLevel: maxLevel ?? null, currentQty: 0 },
  });

  return NextResponse.json(parLevel);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PURCHASER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { parLevels } = body as {
    parLevels: { productId: string; locationId: string; minLevel: number; maxLevel?: number | null }[];
  };

  if (!Array.isArray(parLevels) || parLevels.length === 0) {
    return NextResponse.json({ error: "No par levels provided" }, { status: 400 });
  }

  const results = await prisma.$transaction(
    parLevels.map((pl) =>
      prisma.parLevel.upsert({
        where: { productId_locationId: { productId: pl.productId, locationId: pl.locationId } },
        update: { minLevel: pl.minLevel, maxLevel: pl.maxLevel ?? null },
        create: { productId: pl.productId, locationId: pl.locationId, minLevel: pl.minLevel, maxLevel: pl.maxLevel ?? null, currentQty: 0 },
      })
    )
  );

  return NextResponse.json({ updated: results.length });
}
