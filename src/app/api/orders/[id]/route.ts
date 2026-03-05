import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      location: true,
      requestedBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
      approvals: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const role = session.user.role;
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Status transition logic
  const now = new Date();
  const updateData: Record<string, unknown> = {};

  if (status === "PENDING_APPROVAL" && order.status === "DRAFT") {
    updateData.status = "PENDING_APPROVAL";
  } else if (status === "APPROVED" && order.status === "PENDING_APPROVAL" && (role === "ADMIN" || role === "MANAGER")) {
    updateData.status = "APPROVED";
    updateData.approvedAt = now;
    await prisma.approval.create({
      data: { purchaseOrderId: id, userId: session.user.id, action: "APPROVED", notes: notes || null },
    });
  } else if (status === "REJECTED" && order.status === "PENDING_APPROVAL" && (role === "ADMIN" || role === "MANAGER")) {
    updateData.status = "CANCELLED";
    updateData.cancelledAt = now;
    await prisma.approval.create({
      data: { purchaseOrderId: id, userId: session.user.id, action: "REJECTED", notes: notes || null },
    });
  } else if (status === "ORDERED" && order.status === "APPROVED" && (role === "ADMIN" || role === "PURCHASER")) {
    updateData.status = "ORDERED";
    updateData.orderedAt = now;
  } else if (status === "SHIPPED" && order.status === "ORDERED" && (role === "ADMIN" || role === "PURCHASER")) {
    updateData.status = "SHIPPED";
    updateData.shippedAt = now;
  } else if (status === "DELIVERED" && (order.status === "ORDERED" || order.status === "SHIPPED")) {
    updateData.status = "DELIVERED";
    updateData.deliveredAt = now;
  } else if (status === "CANCELLED") {
    updateData.status = "CANCELLED";
    updateData.cancelledAt = now;
  } else {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      vendor: true,
      location: true,
      requestedBy: { select: { name: true } },
      items: true,
      approvals: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(updated);
}
