"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Local authentication - no API call needed
    const MANAGER_EMAIL = "manager@gmail.com";
    const MANAGER_PASSWORD = "manager123";

    // Simulate loading delay for better UX
    setTimeout(() => {
      try {
        // Validate credentials locally
        if (email.toLowerCase() !== MANAGER_EMAIL.toLowerCase()) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        if (password !== MANAGER_PASSWORD) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        // Generate a simple local token (timestamp-based identifier)
        const localToken = `local_manager_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Store user data and token in localStorage
        localStorage.setItem("authToken", localToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: "local_manager_user",
            email: MANAGER_EMAIL,
            name: "Manager",
            role: "Manager",
          })
        );
        localStorage.setItem("authType", "manager");

        // Redirect to manager panel
        router.push("/manager");
      } catch (err: any) {
        setError(err.message || "Login failed. Please try again.");
        setLoading(false);
      }
    }, 300); // Small delay for better UX
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Manager Login</CardTitle>
          <CardDescription className="text-lg">
            Sign in to access the manager panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

