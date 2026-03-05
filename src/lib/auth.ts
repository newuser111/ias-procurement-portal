import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { location: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locationId: user.locationId,
          locationName: user.location?.name ?? null,
          locationCode: user.location?.code ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role;
        token.locationId = (user as Record<string, unknown>).locationId;
        token.locationName = (user as Record<string, unknown>).locationName;
        token.locationCode = (user as Record<string, unknown>).locationCode;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MANAGER" | "PURCHASER" | "EMPLOYEE";
        session.user.locationId = token.locationId as string | null;
        session.user.locationName = token.locationName as string | null;
        session.user.locationCode = token.locationCode as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
});
