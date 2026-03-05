import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PURCHASER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendors = await prisma.vendor.findMany({
    include: { _count: { select: { products: true, purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(vendors);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const vendor = await prisma.vendor.create({ data: body });
  return NextResponse.json(vendor, { status: 201 });
}
