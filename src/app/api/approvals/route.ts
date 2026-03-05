import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const locationId = session.user.locationId;

  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { status: "PENDING_APPROVAL" };
  if (role === "MANAGER" && locationId) {
    where.locationId = locationId;
  }

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { name: true, code: true } },
      location: { select: { name: true, code: true } },
      requestedBy: { select: { name: true, email: true } },
      items: { select: { name: true, quantity: true, unitPrice: true, totalPrice: true } },
    },
    orderBy: { requestedAt: "asc" },
  });

  return NextResponse.json(orders);
}
