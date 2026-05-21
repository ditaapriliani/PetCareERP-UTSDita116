import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransactionsFn, saveTransactionFn, deleteTransactionFn } from "@/functions/transactions";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transaksi — PetCare ERP" }] }),
  component: TxPage,
});

type Tx = {
  id: string;
  code: string;
  customer: string;
  product: string;
  qty: number;
  total: number;
  status: "Lunas" | "Pending" | "Batal";
  date: string;
};

const statusStyle: Record<Tx["status"], string> = {
  Lunas: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Batal: "bg-destructive/15 text-destructive border-destructive/30",
};

function TxPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactionsFn(),
  });

  const saveMutation = useMutation({
    mutationFn: (t: Tx) => saveTransactionFn({ data: {
      id: t.id,
      customerName: t.customer,
      productName: t.product,
      qty: t.qty,
      total: t.total,
      status: t.status,
    }}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
      toast.success("Transaksi dibuat");
    },
    onError: () => toast.error("Gagal membuat transaksi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransactionFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaksi dihapus");
    },
    onError: () => toast.error("Gagal menghapus transaksi"),
  });

  const filtered = items.filter((t: any) =>
    [t.code, t.customer, t.product].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const save = (t: Tx) => { 
    saveMutation.mutate(t);
  };

  return (
    <div>
      <PageHeader
        title="Transaksi"
        description="Catatan transaksi penjualan harian."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus /> Transaksi Baru</Button></DialogTrigger>
            <TxDialog onSave={save} isPending={saveMutation.isPending} />
          </Dialog>
        }
      />
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari transaksi..." className="pl-9" />
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Kode</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right pr-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Memuat data...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Tidak ada transaksi.</TableCell></TableRow>
            ) : (
              filtered.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="pl-4 font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{t.product}</TableCell>
                  <TableCell>{t.qty}</TableCell>
                  <TableCell className="font-semibold text-primary">Rp {t.total.toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <span className={`rounded-md border px-2 py-1 text-xs ${statusStyle[t.status as Tx["status"]]}`}>{t.status}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button size="icon" variant="ghost" onClick={() => { if(confirm("Hapus transaksi?")) deleteMutation.mutate(t.id); }} disabled={deleteMutation.isPending}><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { getCustomersFn } from "@/functions/customers";
import { getProductsFn } from "@/functions/products";

function TxDialog({ onSave, isPending }: { onSave: (t: Tx) => void; isPending: boolean }) {
  const [f, setF] = useState<Tx>({
    id: "",
    code: "", // Code will be generated in backend
    customer: "", product: "", qty: 1, total: 0, status: "Lunas",
    date: new Date().toISOString().slice(0, 10),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersFn(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsFn(),
  });

  // Calculate total automatically
  useEffect(() => {
    const p = products.find((x: any) => x.name === f.product);
    if (p) {
      setF((prev) => ({ ...prev, total: p.price * prev.qty }));
    }
  }, [f.product, f.qty, products]);

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Transaksi Baru</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2 col-span-2"><Label>Tanggal (Otomatis hari ini)</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} disabled /></div>
        </div>
        <div className="grid gap-2">
          <Label>Customer</Label>
          <Select value={f.customer} onValueChange={(v) => setF({ ...f, customer: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih Customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Produk</Label>
          <Select value={f.product} onValueChange={(v) => setF({ ...f, product: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih Produk" /></SelectTrigger>
            <SelectContent>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2"><Label>Qty</Label><Input type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })} /></div>
          <div className="grid gap-2"><Label>Total</Label><Input type="number" value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v: any) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Lunas">Lunas</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Batal">Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(f)} disabled={!f.customer || !f.product || isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

