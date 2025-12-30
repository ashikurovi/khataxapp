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
import { Loader2, Phone } from "lucide-react";
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
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleAddPhoneFromContacts = async () => {
    // Show toast notification
    toast.info("Add Phone Number", {
      description: "Click the button to add phone from contacts",
      duration: 2000,
    });

    try {
      // Check if Contacts API is available (Chrome/Edge)
      const nav = navigator as any;
      if ("contacts" in navigator && nav.contacts && "select" in nav.contacts) {
        const contacts = await nav.contacts.select(["tel"], { multiple: false });
        if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
          const phoneNumber = contacts[0].tel[0].value;
          setValue("phone", phoneNumber);
          toast.success("Phone number added from contacts!", {
            description: `Added: ${phoneNumber}`,
            duration: 3000,
          });
          return;
        }
      }
      
      // For mobile devices - show helpful instructions
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        toast.info("Mobile Device Detected", {
          description: "Long press the phone input field to access your contacts, or enter manually",
          duration: 4000,
        });
      } else {
        toast.info("Enter Phone Number", {
          description: "Please enter the phone number manually in the field",
          duration: 3000,
        });
      }
    } catch (error) {
      // If Contacts API fails or is not supported
      toast.info("Phone Number Input", {
        description: "Please enter the phone number manually. Format: +8801234567890",
        duration: 3000,
      });
    }
  };

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
        // Store user data including userId and token in localStorage
        if (typeof window !== "undefined" && response.data?.userId) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: user.email,
              role: "Member",
              userId: response.data.userId,
            })
          );
          if (response.data?.token) {
            localStorage.setItem("authToken", response.data.token);
          }
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
              <div className="flex gap-2">
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+8801234567890"
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddPhoneFromContacts}
                  disabled={loading}
                  className="shrink-0"
                  title="Add phone from contacts"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
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

