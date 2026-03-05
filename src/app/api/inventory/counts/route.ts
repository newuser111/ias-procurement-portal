import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const productId = searchParams.get("productId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") || "100");
  const sessionsOnly = searchParams.get("sessions") === "true";

  const role = session.user.role;
  const userLocationId = session.user.locationId;

  const effectiveLocationId =
    role === "ADMIN" || role === "PURCHASER"
      ? locationId || undefined
      : userLocationId || undefined;

  if (sessionsOnly) {
    // Return count sessions (for admin count history tab)
    const sessions = await prisma.inventoryCountSession.findMany({
      where: {
        ...(effectiveLocationId ? { locationId: effectiveLocationId } : {}),
      },
      include: {
        location: { select: { name: true, code: true } },
        countedBy: { select: { name: true } },
        _count: { select: { counts: true } },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ sessions });
  }

  const where: Record<string, unknown> = {};
  if (effectiveLocationId) where.locationId = effectiveLocationId;
  if (productId) where.productId = productId;
  if (from || to) {
    where.countedAt = {};
    if (from) (where.countedAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.countedAt as Record<string, unknown>).lte = new Date(to);
  }

  const counts = await prisma.inventoryCount.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true, vendor: { select: { name: true } } } },
      location: { select: { name: true, code: true } },
      countedBy: { select: { name: true } },
    },
    orderBy: { countedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ counts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;
  const userLocationId = session.user.locationId;

  const body = await req.json();
  const { locationId, counts, sessionNotes } = body as {
    locationId: string;
    counts: { productId: string; quantity: number; notes?: string }[];
    sessionNotes?: string;
  };

  if (!locationId || !Array.isArray(counts) || counts.length === 0) {
    return NextResponse.json({ error: "Missing locationId or counts" }, { status: 400 });
  }

  // Employees/managers can only count at their own location
  if (role !== "ADMIN" && role !== "PURCHASER" && userLocationId !== locationId) {
    return NextResponse.json({ error: "Cannot count inventory at another location" }, { status: 403 });
  }

  // Create session + counts + update par levels in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the count session
    const countSession = await tx.inventoryCountSession.create({
      data: {
        locationId,
        countedById: userId,
        status: "COMPLETED",
        completedAt: new Date(),
        notes: sessionNotes || null,
      },
    });

    // Create individual counts
    const countRecords = await Promise.all(
      counts.map((c) =>
        tx.inventoryCount.create({
          data: {
            productId: c.productId,
            locationId,
            quantity: c.quantity,
            countedById: userId,
            countedAt: new Date(),
            sessionId: countSession.id,
            notes: c.notes || null,
          },
        })
      )
    );

    // Update ParLevel.currentQty for each counted product
    await Promise.all(
      counts.map((c) =>
        tx.parLevel.upsert({
          where: { productId_locationId: { productId: c.productId, locationId } },
          update: { currentQty: c.quantity },
          create: { productId: c.productId, locationId, currentQty: c.quantity, minLevel: 0 },
        })
      )
    );

    return { session: countSession, countsCreated: countRecords.length };
  });

  return NextResponse.json(result);
}
