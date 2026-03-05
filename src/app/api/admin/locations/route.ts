import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locations = await prisma.location.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(locations);
}
