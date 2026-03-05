import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MANAGER" | "PURCHASER" | "EMPLOYEE";
      locationId: string | null;
      locationName: string | null;
      locationCode: string | null;
    } & DefaultSession["user"];
  }
}
