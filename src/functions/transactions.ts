import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const getTransactionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const transactions = await prisma.transaction.findMany({
    include: {
      customer: true,
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    code: `TRX-${t.id.slice(-4).toUpperCase()}`, // Generate simple code from ID
    customer: t.customer?.name || "Unknown",
    product: t.product?.name || "Unknown",
    qty: t.quantity,
    total: t.totalPrice,
    status: t.status as "Lunas" | "Pending" | "Batal",
    date: t.createdAt.toISOString().slice(0, 10),
  }));
});

export const saveTransactionFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id?: string;
    customerName: string;
    productName: string;
    qty: number;
    total: number;
    status: string;
  }) => d)
  .handler(async ({ data }) => {
    // Attempt to find customer and product by name
    let customer = await prisma.customer.findFirst({
      where: { name: { equals: data.customerName, mode: "insensitive" } }
    });
    
    // If not found, create a dummy customer to satisfy relations
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: data.customerName }
      });
    }

    let product = await prisma.product.findFirst({
      where: { name: { equals: data.productName, mode: "insensitive" } }
    });

    if (!product) {
      product = await prisma.product.create({
        data: { name: data.productName, category: "Uncategorized", price: 0, stock: 0 }
      });
    }

    const { id, qty, total, status } = data;

    if (id && id.length > 10) {
      const existing = await prisma.transaction.findUnique({ where: { id } });
      if (existing) {
        return prisma.transaction.update({
          where: { id },
          data: {
            customerId: customer.id,
            productId: product.id,
            quantity: qty,
            totalPrice: total,
            status,
          },
        });
      }
    }

    return prisma.transaction.create({
      data: {
        ...(id && id.length > 10 ? { id } : {}),
        customerId: customer.id,
        productId: product.id,
        quantity: qty,
        totalPrice: total,
        status,
      },
    });
  });

export const deleteTransactionFn = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await prisma.transaction.delete({
      where: { id: data },
    });
    return true;
  });
