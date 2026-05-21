import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";

export const getDashboardDataFn = createServerFn({ method: "GET" })
  .handler(async () => {
    // Basic counts
    const products = await prisma.product.count();
    const customers = await prisma.customer.count();
    const transactions = await prisma.transaction.count();

    // Total Revenue (only Lunas or all?)
    const revenueResult = await prisma.transaction.aggregate({
      _sum: { totalPrice: true },
      where: { status: "Lunas" }
    });
    const revenue = revenueResult._sum.totalPrice || 0;

    // Low stock products
    const lowStockProducts = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
      take: 4,
    });

    // Recent Activity (5 most recent transactions)
    const recentTx = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { customer: true, product: true }
    });

    // Simple 7-day sales aggregation by day
    // In PostgreSQL, you can group by date. For Prisma, it's easier to pull all recent and group in JS.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSales = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: "Lunas"
      },
      select: {
        createdAt: true,
        totalPrice: true
      }
    });

    // Grouping recentSales into days
    const salesMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesMap[d.toLocaleDateString("id-ID", { weekday: "short" })] = 0;
    }

    recentSales.forEach(s => {
      const day = s.createdAt.toLocaleDateString("id-ID", { weekday: "short" });
      if (salesMap[day] !== undefined) {
        salesMap[day] += s.totalPrice;
      }
    });

    const salesData = Object.keys(salesMap).map(key => ({
      d: key,
      v: salesMap[key]
    }));

    // Category Sales (from recent tx or all products?)
    // Just sum stock by category for simplicity, or count products by category
    const catGroup = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    });
    
    const categoryData = catGroup.map(c => ({
      c: c.category,
      v: c._count
    }));

    return {
      stats: {
        revenue,
        products,
        customers,
        transactions
      },
      lowStockProducts,
      recentTx,
      salesData,
      categoryData
    };
  });
