import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "PURCHASER" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const vendorId = searchParams.get("vendorId");

  // For managers, scope to their location
  const effectiveLocationId =
    role === "MANAGER" ? session.user.locationId : locationId || undefined;

  const where: Record<string, unknown> = {};
  if (effectiveLocationId) where.locationId = effectiveLocationId;

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
          vendorId: true,
          vendor: { select: { id: true, name: true, code: true } },
          category: { select: { name: true } },
        },
      },
      location: { select: { id: true, name: true, code: true } },
    },
  });

  // Filter to items below par
  const belowPar = parLevels.filter((pl) => pl.currentQty < pl.minLevel);

  // Optionally filter by vendor
  const filtered = vendorId
    ? belowPar.filter((pl) => pl.product.vendorId === vendorId)
    : belowPar;

  // Build reorder items with suggested quantities
  const reorderItems = filtered.map((pl) => {
    const deficit = pl.minLevel - pl.currentQty;
    const suggestedQty = pl.maxLevel ? pl.maxLevel - pl.currentQty : deficit;
    return {
      productId: pl.product.id,
      productName: pl.product.name,
      sku: pl.product.sku,
      vendorId: pl.product.vendor.id,
      vendorName: pl.product.vendor.name,
      vendorCode: pl.product.vendor.code,
      category: pl.product.category?.name || "Uncategorized",
      locationId: pl.location.id,
      locationName: pl.location.name,
      locationCode: pl.location.code,
      currentQty: pl.currentQty,
      minLevel: pl.minLevel,
      maxLevel: pl.maxLevel,
      deficit,
      suggestedQty: Math.max(suggestedQty, 0),
      unitPrice: pl.product.unitPrice,
      unitOfMeasure: pl.product.unitOfMeasure,
      estimatedCost: Math.max(suggestedQty, 0) * pl.product.unitPrice,
    };
  });

  // Group by vendor
  const byVendor: Record<
    string,
    {
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      totalEstimatedCost: number;
      itemCount: number;
      items: typeof reorderItems;
    }
  > = {};

  for (const item of reorderItems) {
    if (!byVendor[item.vendorCode]) {
      byVendor[item.vendorCode] = {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        vendorCode: item.vendorCode,
        totalEstimatedCost: 0,
        itemCount: 0,
        items: [],
      };
    }
    byVendor[item.vendorCode].items.push(item);
    byVendor[item.vendorCode].totalEstimatedCost += item.estimatedCost;
    byVendor[item.vendorCode].itemCount++;
  }

  // Sort vendors by total cost descending, items within each by deficit descending
  const vendorGroups = Object.values(byVendor)
    .sort((a, b) => b.totalEstimatedCost - a.totalEstimatedCost)
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => b.deficit - a.deficit),
    }));

  return NextResponse.json({
    totalItems: reorderItems.length,
    totalEstimatedCost: reorderItems.reduce((sum, i) => sum + i.estimatedCost, 0),
    vendorGroups,
  });
}
