"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dept: z.string().min(2, "Department is required"),
  institute: z.string().min(2, "Institute is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error("Authentication required. Please sign in again.");
        router.push("/");
        return;
      }

      const response = await apiClient.post("/auth/register", {
        ...data,
        email: user.email,
        picture: user.photoURL || "",
        googleId: user.uid,
      });

      if (response.success) {
        // Store user data including userId in localStorage
        if (typeof window !== "undefined" && response.data?.userId) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: user.email,
              role: "Member",
              userId: response.data.userId,
            })
          );
          localStorage.setItem("authType", "google");
        }
        
        toast.success("Registration successful! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(response.error || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            Please provide the following information to complete your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input
                id="dept"
                {...register("dept")}
                placeholder="Computer Science"
                disabled={loading}
              />
              {errors.dept && (
                <p className="text-sm text-destructive">{errors.dept.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institute">Institute</Label>
              <Input
                id="institute"
                {...register("institute")}
                placeholder="University Name"
                disabled={loading}
              />
              {errors.institute && (
                <p className="text-sm text-destructive">{errors.institute.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+8801234567890"
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

