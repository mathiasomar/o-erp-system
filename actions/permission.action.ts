"use server";

import { ActivityAction } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-logger";
import prisma from "@/lib/prisma";
import { loadPermissions } from "@/lib/role";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  permissionKeys: z.array(z.string()),
});

export const updateRolePermissions = async (
  role: "ADMIN" | "MANAGER" | "CASHIER",
  permissionKeys: string[],
) => {
  const parsed = schema.safeParse({ role, permissionKeys });
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  // Admins must always keep certain critical permissions
  if (role === "ADMIN") {
    const required = [
      "users.view",
      "users.edit",
      "settings.view",
      "settings.edit",
      "dashboard.view",
    ];
    for (const key of required) {
      if (!permissionKeys.includes(key)) {
        return {
          success: false,
          error: `Admin must retain: ${required.join(", ")}`,
        };
      }
    }
  }

  // Get all permission records for the given keys
  const permissions = await prisma.permission.findMany({
    where: { key: { in: permissionKeys } },
  });

  // Delete ALL existing role permissions for this role
  await prisma.rolePermission.deleteMany({ where: { role } });

  // Re-create with new set
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      role,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // Bust the in-memory cache so next request reads fresh
  await loadPermissions();

  await logActivity({
    action: ActivityAction.PERMISSIONS_UPDATED,
    entity: "Permissions",
    entityLabel: `${role} role`,
    meta: { count: permissionKeys.length },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  return { success: true };
};
