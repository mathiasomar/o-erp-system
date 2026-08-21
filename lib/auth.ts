import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { normalizeName } from "./utils";
import { ActivityAction, UserRole } from "@/generated/prisma/enums";
import { logActivity } from "./activity-logger";
import { username } from "better-auth/plugins/username";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  session: {
    expiresIn: 60 * 30, // 30 minutes in seconds
    updateAge: 60 * 5, // Refresh session if < 5 minutes remaining
    additionalFields: {
      role: { type: "string" },
      isActive: { type: "boolean" },
    },
  },
  appName: "POS",
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const name = normalizeName(ctx.body.name);

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              name,
            },
          },
        };
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // ── Sign in ─────────────────────────────────────────────────────────────
      if (ctx.path === "/sign-in/email") {
        try {
          const email = ctx.body?.email as string | undefined;
          if (!email) return;

          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, role: true },
          });

          if (user) {
            await logActivity({
              action: ActivityAction.USER_LOGIN,
              entity: "User",
              entityId: user.id,
              entityLabel: user.name ?? user.email,
              userId: user.id,
              meta: {
                email: user.email,
                role: user.role,
              },
            });
          }
        } catch {
          // never throw from hook
        }
      }

      if (ctx.path === "/sign-in/username") {
        try {
          const username = ctx.body?.username as string | undefined;
          if (!username) return;

          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              username: true,
            },
          });

          if (user) {
            await logActivity({
              action: ActivityAction.USER_LOGIN,
              entity: "User",
              entityId: user.id,
              entityLabel: user.username ?? user.email,
              userId: user.id,
              meta: {
                email: user.email,
                role: user.role,
                username: user.username,
              },
            });
          }
        } catch {
          // never throw from hook
        }
      }

      // ── Sign out ─────────────────────────────────────────────────────────────
      if (ctx.path === "/sign-out") {
        try {
          // Session is still valid at this point — read it from the DB
          const sessionToken = ctx.headers
            ?.get?.("cookie")
            ?.split(";")
            ?.find((c) => c.trim().startsWith("better-auth.session_token="))
            ?.split("=")?.[1]
            ?.trim();

          if (sessionToken) {
            const session = await prisma.session.findFirst({
              where: { token: sessionToken },
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            });

            if (session?.user) {
              await logActivity({
                action: ActivityAction.USER_LOGOUT,
                entity: "User",
                entityId: session.user.id,
                entityLabel: session.user.name ?? session.user.email,
                userId: session.user.id,
                meta: { email: session.user.email },
              });
            }
          }
        } catch {
          // never throw
        }
      }

      // ── Sign up ───────────────────────────────────────────────────────────────
      if (ctx.path === "/sign-up/email") {
        try {
          const email = ctx.body?.email as string | undefined;
          if (!email) return;

          // Small delay to ensure user is committed to DB
          await new Promise((r) => setTimeout(r, 100));

          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, role: true },
          });

          if (user) {
            await logActivity({
              action: ActivityAction.USER_CREATED,
              entity: "User",
              entityId: user.id,
              entityLabel: user.name ?? user.email,
              userId: user.id,
              meta: {
                email: user.email,
                role: user.role,
              },
            });
          }
        } catch {
          // never throw
        }
      }
    }),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.CASHIER,
      },
      isActive: { type: "boolean", defaultValue: true },
    },
  },
  plugins: [nextCookies(), username()],
});
