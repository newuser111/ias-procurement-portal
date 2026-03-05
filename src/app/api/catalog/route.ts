import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { active: true };
  if (vendorId) where.vendorId = vendorId;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, vendors, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ products, vendors, categories });
}
