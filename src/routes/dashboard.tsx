import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  PawPrint,
  Users,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/functions/dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PetCare ERP" },
      { name: "description", content: "Ringkasan analytics pet shop: penjualan, customer, dan stok." },
    ],
  }),
  component: Dashboard,
});

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardDataFn(),
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader
          title="Selamat datang di PetCare 🐾"
          description="Ringkasan performa pet shop kamu hari ini."
        />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat dashboard...
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Pendapatan", value: formatRp(data.stats.revenue), delta: "Lunas", icon: TrendingUp },
    { label: "Produk", value: String(data.stats.products), delta: "total item", icon: PawPrint },
    { label: "Customer", value: String(data.stats.customers), delta: "terdaftar", icon: Users },
    { label: "Transaksi", value: String(data.stats.transactions), delta: "tercatat", icon: Receipt },
  ];

  return (
    <div>
      <PageHeader
        title="Selamat datang di PetCare 🐾"
        description="Ringkasan performa pet shop kamu hari ini."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{s.value}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                    <ArrowUpRight className="h-3 w-3" /> {s.delta}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan 7 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 50)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 50)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.015 40)" />
                <XAxis dataKey="d" stroke="oklch(0.68 0.02 60)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.02 60)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.012 40)",
                    border: "1px solid oklch(0.27 0.015 40)",
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="v" stroke="oklch(0.72 0.19 50)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori terlaris</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.015 40)" />
                <XAxis dataKey="c" stroke="oklch(0.68 0.02 60)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.02 60)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.012 40)",
                    border: "1px solid oklch(0.27 0.015 40)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="v" fill="oklch(0.72 0.19 50)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Aktivitas terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentTx.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada transaksi.</p>
            ) : (
              data.recentTx.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Transaksi #{tx.id.slice(-4).toUpperCase()} — {tx.customer?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.product?.name ?? "Unknown"} · Rp {tx.totalPrice?.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${tx.status === "Lunas" ? "border-green-500/30 bg-green-500/10 text-green-400" :
                      tx.status === "Pending" ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" :
                        "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}>{tx.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stok menipis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Semua stok aman.</p>
            ) : (
              data.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <span className="text-sm">{p.name}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${p.stock <= 5 ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-400"
                    }`}>
                    {p.stock} tersisa
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
