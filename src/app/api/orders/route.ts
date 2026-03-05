import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  // Admin/Purchaser see all, others see their own
  const where = role === "ADMIN" || role === "PURCHASER" ? {} : { requestedById: userId };

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { name: true, code: true } },
      location: { select: { name: true, code: true } },
      requestedBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { vendorId, locationId, priority, notes, items, submit } = body;

  if (!vendorId || !locationId || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate order number
  const count = await prisma.purchaseOrder.count();
  const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const totalAmount = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      vendorId,
      locationId,
      requestedById: session.user.id,
      priority: priority || "NORMAL",
      notes: notes || null,
      status: submit ? "PENDING_APPROVAL" : "DRAFT",
      totalAmount,
      items: {
        create: items.map((item: { productId?: string; name: string; quantity: number; unitPrice: number; notes?: string }) => ({
          productId: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes || null,
        })),
      },
    },
    include: {
      items: true,
      vendor: { select: { name: true } },
      location: { select: { name: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
