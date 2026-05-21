import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Bell, Search, LogOut, User, Loader2, PawPrint, Users, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { globalSearchFn } from "@/functions/search";
import { toast } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-4 text-muted-foreground">Halaman tidak ditemukan</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PetCare ERP — Pet Shop Management" },
      { name: "description", content: "Modern ERP suite untuk pet shop: kelola produk, customer, transaksi, dan staff." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L20.12 8.12a2.85 2.83 0 1 1-4-4Z'/%3E%3Cpath d='m16.88 7.12-9.76 9.76'/%3E%3Cpath d='M8.12 20.12a2.85 2.83 0 1 1-4-4L6 14.24a2.85 2.83 0 1 1 4 4Z'/%3E%3Cpath d='m15.88 15.88 4.24-4.24a2.85 2.83 0 1 1-4-4l-1.88 1.88a2.85 2.83 0 1 1-4-4Z'/%3E%3Cpath d='m9.5 14.24-4.24 4.24a2.85 2.83 0 1 1 4-4l1.88-1.88a2.85 2.83 0 1 1-4-4Z'/%3E%3C/svg%3E" }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Robust check for login page to avoid hydration timing issues
  const isLoginPage = pathname === "/" || (typeof window !== "undefined" && window.location.pathname === "/");

  // Check login state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    products: any[];
    customers: any[];
    transactions: any[];
  } | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("petcare_logged_in") === "true";
    setIsAuthenticated(loggedIn);

    if (!loggedIn && !isLoginPage) {
      router.navigate({ to: "/" });
    }
  }, [pathname, isLoginPage, router]);

  // Handle Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handle live search querying
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await globalSearchFn({ data: searchQuery });
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem("petcare_logged_in");
    toast.success("Berhasil keluar", {
      description: "Anda telah keluar dari dashboard.",
    });
    router.navigate({ to: "/" });
  };

  // If it's the login page, render it directly without any sidebar or wrapper
  if (isLoginPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Prevent rendering the dashboard layout/sidebar if the user is not authenticated
  if (isAuthenticated === false) {
    return null;
  }

  // Show loading indicator only during the initial client-side auth check
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary animate-pulse"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              {/* Functional Search Bar Trigger Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="relative hidden flex-1 max-w-md md:flex items-center text-left text-sm text-muted-foreground border border-input rounded-md h-9 px-9 bg-transparent hover:bg-accent/40 transition-colors cursor-pointer select-none"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                Cari produk, customer, transaksi...
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-600 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm transition-opacity">
                      A
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1 border-border/40 bg-card/95 backdrop-blur-md">
                    <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted/40" />
                    <DropdownMenuItem className="cursor-default text-muted-foreground py-2">
                      <User className="mr-2 h-4 w-4" />
                      <span>Administrator</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-muted/40" />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Command Search Palette Dialog */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput
            placeholder="Cari produk, customer, atau transaksi..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="border-t border-border/40 bg-card/95 max-h-[350px]">
            {searchLoading && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Mencari database...
              </div>
            )}
            {!searchLoading && searchQuery && (!searchResults || (searchResults.products.length === 0 && searchResults.customers.length === 0 && searchResults.transactions.length === 0)) && (
              <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                Hasil pencarian tidak ditemukan.
              </CommandEmpty>
            )}
            {!searchQuery && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Ketik nama produk, customer, atau ID transaksi untuk mencari.
              </div>
            )}

            {searchResults && searchResults.products.length > 0 && (
              <CommandGroup heading="Produk">
                {searchResults.products.map((p: any) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => {
                      setSearchOpen(false);
                      router.navigate({ to: "/products" });
                    }}
                    className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
                  >
                    <PawPrint className="mr-3 h-4 w-4 text-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Kategori: {p.category} · Harga: Rp {p.price.toLocaleString("id-ID")} · Stok: {p.stock}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults && searchResults.customers.length > 0 && (
              <CommandGroup heading="Customer">
                {searchResults.customers.map((c: any) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => {
                      setSearchOpen(false);
                      router.navigate({ to: "/customers" });
                    }}
                    className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
                  >
                    <Users className="mr-3 h-4 w-4 text-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Email: {c.email || "-"} · Telepon: {c.phone || "-"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults && searchResults.transactions.length > 0 && (
              <CommandGroup heading="Transaksi">
                {searchResults.transactions.map((t: any) => (
                  <CommandItem
                    key={t.id}
                    onSelect={() => {
                      setSearchOpen(false);
                      router.navigate({ to: "/transactions" });
                    }}
                    className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
                  >
                    <Receipt className="mr-3 h-4 w-4 text-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        Transaksi #{t.id.slice(-6).toUpperCase()} — {t.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Customer: {t.customer?.name || "Unknown"} · Produk: {t.product?.name || "Unknown"} · Total: Rp {t.totalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>

        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
