import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ActivityAction } from "@/generated/prisma/enums";
import prisma from "./prisma";

export type ActivityMeta = Record<string, string | number | boolean | null>;

type LogInput = {
  action: ActivityAction;
  entity: string;
  entityId?: string;
  entityLabel?: string;
  branchId?: string;
  meta?: ActivityMeta;
  userId?: string; // optional override — if not passed, reads from session
};

// ── Core logger ───────────────────────────────────────────────────────────────
// Call this from any server action after a successful DB mutation.

export const logActivity = async (input: LogInput): Promise<void> => {
  try {
    let userId = input.userId ?? null;

    // If no userId passed, try to get it from the current session
    if (!userId) {
      try {
        const session = await auth.api.getSession({
          headers: await headers(),
        });
        userId = session?.user?.id ?? null;
      } catch {
        // session not available in all contexts — swallow silently
      }
    }

    await prisma.activityLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        branchId: input.branchId ?? null,
        entityLabel: input.entityLabel ?? null,
        meta: input.meta ?? undefined,
        userId,
      },
    });
  } catch (err) {
    // Never let logging break the main flow
    console.error("[ActivityLogger] Failed to log activity:", err);
  }
};
