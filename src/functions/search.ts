import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";

export const globalSearchFn = createServerFn({ method: "GET" })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    if (!query || query.trim() === "") {
      return { products: [], customers: [], transactions: [] };
    }

    const trimmed = query.trim();

    // 1. Search products (by name or category)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { category: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    // 2. Search customers (by name, email, or phone)
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    // 3. Search transactions (by transaction ID, customer name, or product name)
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { id: { contains: trimmed, mode: "insensitive" } },
          { customer: { name: { contains: trimmed, mode: "insensitive" } } },
          { product: { name: { contains: trimmed, mode: "insensitive" } } },
        ],
      },
      include: {
        customer: true,
        product: true,
      },
      take: 5,
    });

    return { products, customers, transactions };
  });
