import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Trash2, Camera, FileText, Upload, Mail, Phone } from "lucide-react";
import { fileToDataUrl } from "@/lib/storage";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaffFn, saveStaffFn, deleteStaffFn } from "@/functions/staff";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff — PetCare ERP" }] }),
  component: StaffPage,
});

type Doc = { name: string; data: string };
type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  photo?: string | null;
  docs: Doc[];
};

function StaffPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const { data: serverStaff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaffFn(),
  });

  const items: Staff[] = serverStaff.map((s: any) => {
    let docs: Doc[] = [];
    if (s.documentUrl) {
      try { docs = JSON.parse(s.documentUrl); } catch (e) {}
    }
    return {
      id: s.id,
      name: s.name,
      role: s.position,
      email: s.email || "",
      phone: s.phone || "",
      photo: s.photoUrl,
      docs,
    };
  });

  const saveMutation = useMutation({
    mutationFn: (s: Staff) => saveStaffFn({ data: {
      id: s.id,
      name: s.name,
      position: s.role,
      email: s.email || undefined,
      phone: s.phone || undefined,
      photoUrl: s.photo || undefined,
      documentUrl: s.docs.length > 0 ? JSON.stringify(s.docs) : undefined,
    }}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setOpen(false);
      setEditing(null);
      toast.success("Staff disimpan");
    },
    onError: () => toast.error("Gagal menyimpan staff"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaffFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Dihapus");
    },
    onError: () => toast.error("Gagal menghapus staff"),
  });

  const save = (s: Staff) => {
    saveMutation.mutate(s);
  };

  return (
    <div>
      <PageHeader
        title="Staff Pet Shop"
        description="Kelola data karyawan, foto profil, dan dokumen kerja."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus /> Tambah Staff</Button></DialogTrigger>
            <StaffDialog initial={editing} onSave={save} isPending={saveMutation.isPending} />
          </Dialog>
        }
      />
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Memuat data staff...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-primary/30 via-orange-600/20 to-transparent" />
              <CardContent className="-mt-10 p-5">
                <div className="flex items-end justify-between">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-card bg-accent">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                        {s.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }} disabled={deleteMutation.isPending}><Pencil /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Hapus staff?")) deleteMutation.mutate(s.id); }} disabled={deleteMutation.isPending}><Trash2 /></Button>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
                <span className="inline-block rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{s.role}</span>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {s.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {s.docs.length} dokumen</span>
                  <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> {s.photo ? "Foto OK" : "Belum ada foto"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffDialog({ initial, onSave, isPending }: { initial: Staff | null; onSave: (s: Staff) => void; isPending: boolean }) {
  const [f, setF] = useState<Staff>(
    initial ?? { id: "", name: "", role: "", email: "", phone: "", photo: "", docs: [] },
  );

  useEffect(() => {
    setF(initial ?? { id: "", name: "", role: "", email: "", phone: "", photo: "", docs: [] });
  }, [initial]);

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isDocsUploading, setIsDocsUploading] = useState(false);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setIsPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (f.id) {
        formData.append('employeeId', f.id);
      }
      
      const res = await fetch('/upload/employee-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Gagal mengupload foto');
      }
      
      const data = await res.json();
      setF((s) => ({ ...s, photo: data.url }));
      toast.success('Foto staff berhasil diupload');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengupload foto');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const onDocs = async (files?: FileList | null) => {
    if (!files) return;
    setIsDocsUploading(true);
    try {
      const arr: Doc[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        if (f.id) {
          formData.append('employeeId', f.id);
        }
        
        const res = await fetch('/upload/employee-document', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          throw new Error(`Gagal mengupload dokumen: ${file.name}`);
        }
        
        const data = await res.json();
        arr.push({ name: file.name, data: data.url });
      }
      setF((s) => ({ ...s, docs: [...s.docs, ...arr] }));
      toast.success('Dokumen berhasil diupload');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengupload dokumen');
    } finally {
      setIsDocsUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{initial ? "Edit Staff" : "Tambah Staff"}</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <label className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border bg-accent/30 hover:border-primary">
            {f.photo ? (
              <img src={f.photo} alt="" className="h-full w-full object-cover" />
            ) : isPhotoUploading ? (
              <div className="flex h-full w-full items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : (
              <div className="flex h-full w-full items-center justify-center"><Camera className="h-5 w-5 text-muted-foreground" /></div>
            )}
            <input type="file" accept="image/*" className="hidden" disabled={isPhotoUploading} onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          <p className="text-xs text-muted-foreground">
            {isPhotoUploading ? "Sedang mengunggah..." : "Klik untuk upload foto profil staff."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2"><Label>Nama</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Jabatan</Label><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2"><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Telepon</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        </div>
        <div className="grid gap-2">
          <Label>Dokumen Kerja (CV, Kontrak, dll.)</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-accent/20 p-4 text-sm text-muted-foreground hover:border-primary">
            {isDocsUploading ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Mengunggah dokumen...</span>
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload dokumen
              </>
            )}
            <input type="file" multiple className="hidden" disabled={isDocsUploading} onChange={(e) => onDocs(e.target.files)} />
          </label>
          {f.docs.length > 0 && (
            <ul className="space-y-1.5">
              {f.docs.map((d, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                  <a href={d.data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate hover:underline text-primary">
                    <FileText className="h-4 w-4" /> {d.name}
                  </a>
                  <Button size="icon" variant="ghost" onClick={() => setF({ ...f, docs: f.docs.filter((_, x) => x !== i) })}><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(f)} disabled={!f.name || isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
