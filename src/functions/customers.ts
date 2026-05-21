import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const getCustomersFn = createServerFn({ method: "GET" }).handler(async () => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return customers;
});

export const saveCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => d)
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    if (id && id.length > 10) {
      const existing = await prisma.customer.findUnique({ where: { id } });
      if (existing) {
        return prisma.customer.update({
          where: { id },
          data: rest,
        });
      }
    }

    return prisma.customer.create({
      data: {
        ...(id && id.length > 10 ? { id } : {}),
        ...rest,
      },
    });
  });

export const deleteCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await prisma.customer.delete({
      where: { id: data },
    });
    return true;
  });
