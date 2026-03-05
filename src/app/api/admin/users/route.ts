import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { location: { select: { name: true, code: true } } },
    orderBy: { name: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return NextResponse.json(
    users.map(({ passwordHash, ...u }: { passwordHash: string; [key: string]: unknown }) => u)
  );
}
