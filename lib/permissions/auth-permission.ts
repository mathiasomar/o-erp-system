"use server";

import { headers } from "next/headers";
import { auth } from "../auth";

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
};
