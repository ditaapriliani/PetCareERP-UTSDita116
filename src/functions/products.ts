import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const getProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return products;
});

export const saveProductFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id?: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description?: string;
    imageUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
  const { id, ...rest } = data;
  if (id && id.length > 10) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (existing) {
      return prisma.product.update({
        where: { id },
        data: rest,
      });
    }
  }

  return prisma.product.create({
    data: {
      ...(id && id.length > 10 ? { id } : {}),
      ...rest,
    },
  });
});

export const deleteProductFn = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
  await prisma.product.delete({
    where: { id: data },
  });
  return true;
});
