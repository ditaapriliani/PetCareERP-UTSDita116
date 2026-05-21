import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const getStaffFn = createServerFn({ method: "GET" }).handler(async () => {
  const staff = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });
  return staff;
});

export const saveStaffFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id?: string;
    name: string;
    position: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    documentUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
  const { id, ...rest } = data;
  if (id && id.length > 10) {
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (existing) {
      return prisma.employee.update({
        where: { id },
        data: rest,
      });
    }
  }

  return prisma.employee.create({
    data: {
      ...(id && id.length > 10 ? { id } : {}),
      ...rest,
    },
  });
});

export const deleteStaffFn = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
  await prisma.employee.delete({
    where: { id: data },
  });
  return true;
});
