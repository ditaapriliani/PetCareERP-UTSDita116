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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomersFn, saveCustomerFn, deleteCustomerFn } from "@/functions/customers";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customer — PetCare ERP" }] }),
  component: CustomersPage,
});

type Customer = { id: string; name: string; email: string; phone: string; pet: string };

function CustomersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data: serverCustomers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersFn(),
  });

  const items: Customer[] = serverCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email || "",
    phone: c.phone || "",
    pet: c.address || "", // Mapped 'address' to 'pet'
  }));

  const saveMutation = useMutation({
    mutationFn: (c: Customer) => saveCustomerFn({ data: {
      id: c.id,
      name: c.name,
      email: c.email || undefined,
      phone: c.phone || undefined,
      address: c.pet || undefined,
    }}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setEditing(null);
      toast.success("Customer disimpan");
    },
    onError: () => toast.error("Gagal menyimpan customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomerFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer dihapus");
    },
    onError: () => toast.error("Gagal menghapus customer"),
  });

  const filtered = items.filter((c) =>
    [c.name, c.email, c.phone, c.pet].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const save = (c: Customer) => {
    saveMutation.mutate(c);
  };

  return (
    <div>
      <PageHeader
        title="Customer"
        description="Database pelanggan setia pet shop."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus /> Tambah Customer</Button>
            </DialogTrigger>
            <CustomerDialog initial={editing} onSave={save} isPending={saveMutation.isPending} />
          </Dialog>
        }
      />

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari customer..." className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Pet</TableHead>
              <TableHead className="text-right pr-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Memuat data...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {c.name[0]}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell>
                    {c.pet && <span className="rounded-md bg-accent px-2 py-1 text-xs">{c.pet}</span>}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }} disabled={deleteMutation.isPending}><Pencil /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if(confirm("Hapus customer?")) deleteMutation.mutate(c.id); }} disabled={deleteMutation.isPending}><Trash2 /></Button>
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

function CustomerDialog({ initial, onSave, isPending }: { initial: Customer | null; onSave: (c: Customer) => void; isPending: boolean }) {
  const [f, setF] = useState<Customer>(initial ?? { id: "", name: "", email: "", phone: "", pet: "" });

  useEffect(() => {
    setF(initial ?? { id: "", name: "", email: "", phone: "", pet: "" });
  }, [initial]);

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit Customer" : "Tambah Customer"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid gap-2"><Label>Nama</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Telepon</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Pet</Label><Input placeholder="contoh: Anjing - Golden" value={f.pet} onChange={(e) => setF({ ...f, pet: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(f)} disabled={!f.name || isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
