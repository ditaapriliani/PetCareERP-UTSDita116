import React, { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bone, Eye, EyeOff, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — PetCare ERP" },
      { name: "description", content: "Masuk ke dashboard management PetCare ERP." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (username === "admin" && password === "admin") {
      localStorage.setItem("petcare_logged_in", "true");
      toast.success("Berhasil masuk ke dashboard!", {
        description: "Selamat datang kembali di PetCare ERP 🐾",
      });
      router.navigate({ to: "/dashboard" });
    } else {
      setError("Username atau password salah. Silakan coba lagi.");
      toast.error("Gagal masuk", {
        description: "Kredensial yang Anda masukkan salah.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative background glows */}
      <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-orange-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            <Bone className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
            PetCare ERP
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistem ERP Modern Pengelolaan Pet Shop & Klinik Hewan
          </p>
        </div>

        {/* Card Container */}
        <Card className="border-border/40 bg-card/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Selamat Datang</CardTitle>
            <CardDescription>
              Silakan masuk menggunakan akun Anda untuk mengelola dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Alert Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    required
                    placeholder="Contoh: admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-border/60 focus-visible:ring-primary focus-visible:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-border/60 focus-visible:ring-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" defaultChecked disabled={isLoading} />
                  <label
                    htmlFor="remember"
                    className="text-xs font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none cursor-pointer"
                  >
                    Ingat saya di perangkat ini
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-primary-foreground h-10 transition-all hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t border-border/30 bg-muted/20 p-6 rounded-b-xl text-center">
            {/* Quick Demo Login Hint */}
            <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-xs text-muted-foreground leading-normal">
              <span className="font-semibold text-foreground">💡 Akun Uji Coba:</span> Use username <code className="rounded bg-muted px-1.5 py-0.5 text-primary font-bold">admin</code> and password <code className="rounded bg-muted px-1.5 py-0.5 text-primary font-bold">admin</code> to sign in.
            </div>
            <p className="text-2xs text-muted-foreground/60">
              © {new Date().getFullYear()} PetCare ERP. All rights reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
