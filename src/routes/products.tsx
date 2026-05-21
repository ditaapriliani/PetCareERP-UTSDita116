import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Trash2, Search, ImageIcon, PawPrint } from "lucide-react";
import { fileToDataUrl } from "@/lib/storage";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductsFn, saveProductFn, deleteProductFn } from "@/functions/products";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Produk — PetCare ERP" }] }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
};

function ProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsFn(),
  });

  const saveMutation = useMutation({
    mutationFn: (p: any) => saveProductFn({ data: p }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditing(null);
      toast.success("Produk disimpan");
    },
    onError: () => toast.error("Gagal menyimpan produk"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk dihapus");
    },
    onError: () => toast.error("Gagal menghapus produk"),
  });

  const filtered = items.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase()),
  );

  const onSave = (p: Product) => {
    saveMutation.mutate({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description ?? undefined,
      imageUrl: p.imageUrl ?? undefined,
    });
  };

  const onDelete = (id: string) => {
    if (confirm("Hapus produk ini?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Produk Pet Shop"
        description="Kelola katalog produk untuk semua jenis hewan peliharaan."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus /> Tambah Produk
              </Button>
            </DialogTrigger>
            <ProductDialog initial={editing} onSave={onSave} isPending={saveMutation.isPending} />
          </Dialog>
        }
      />

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Memuat data produk...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-border/60 transition hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5">
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-accent/40 to-card">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <PawPrint className="h-16 w-16" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
                  {p.category}
                </span>
                {p.stock <= 5 && (
                  <span className="absolute right-3 top-3 rounded-full bg-destructive/90 px-2.5 py-1 text-xs font-medium text-destructive-foreground">
                    Stok {p.stock}
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Stok: {p.stock}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    Rp {p.price.toLocaleString("id-ID")}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }} disabled={deleteMutation.isPending}>
                      <Pencil />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)} disabled={deleteMutation.isPending}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Tidak ada produk ditemukan.
        </div>
      )}
    </div>
  );
}

function ProductDialog({
  initial,
  onSave,
  isPending,
}: {
  initial: Product | null;
  onSave: (p: Product) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<Product>(
    initial ?? { id: "", name: "", category: "Food", price: 0, stock: 0, description: "", imageUrl: "" },
  );

  useEffect(() => {
    setForm(initial ?? { id: "", name: "", category: "Food", price: 0, stock: 0, description: "", imageUrl: "" });
  }, [initial]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (f?: File) => {
    if (!f) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', f);
      if (form.id) {
        formData.append('productId', form.id);
      }
      
      const res = await fetch('/upload/product-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Gagal mengupload gambar');
      }
      
      const data = await res.json();
      setForm((s) => ({ ...s, imageUrl: data.url }));
      toast.success('Gambar produk berhasil diupload');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-accent/30 hover:border-primary">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-[10px] text-muted-foreground">Uploading</span>
              </div>
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
            <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <p className="text-xs text-muted-foreground">
            {isUploading ? "Sedang mengunggah..." : "Upload gambar produk (klik kotak di kiri)."}
          </p>
        </div>
        <div className="grid gap-2">
          <Label>Nama produk</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Kategori</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Stok</Label>
            <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Harga (Rp)</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Deskripsi</Label>
          <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(form)} disabled={!form.name || isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
