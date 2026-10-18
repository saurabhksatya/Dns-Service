import prisma from "@/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "RouteDNS",
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({
        password,
        hash,
      }: {
        password: string;
        hash: string;
      }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "RouteDNS",
    }),
  ],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
