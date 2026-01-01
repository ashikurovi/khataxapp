"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { DailyExtraTable } from "@/components/tables/daily-extra-table";
import { apiClient } from "@/lib/api-client";
import { DailyExtraWithUser, MemberWithUser } from "@/types";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const dailyExtraSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.string(),
});

type DailyExtraForm = z.infer<typeof dailyExtraSchema>;

export default function DailyExtraPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: dailyExtras, isLoading } = useQuery({
    queryKey: ["daily-extra"],
    queryFn: async () => {
      const response = await apiClient.get<DailyExtraWithUser[]>("/daily-extra");
      return response.data || [];
    },
  });

  const { mutate: createDailyExtra, isPending } = useMutation({
    mutationFn: async (data: DailyExtraForm) => {
      return apiClient.post("/daily-extra", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-extra"] });
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setDialogOpen(false);
    },
  });

  const { mutate: deleteDailyExtra, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/daily-extra?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-extra"] });
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      alert("Daily extra deleted successfully");
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this daily extra? This will update all heshab records.")) {
      deleteDailyExtra(id);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DailyExtraForm>({
    resolver: zodResolver(dailyExtraSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      reason: "",
      amount: 0,
    },
  });

  const onSubmit = (data: DailyExtraForm) => {
    createDailyExtra({
      ...data,
      amount: Number(data.amount),
    });
    reset();
  };

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser[]>("/members");
      return response.data || [];
    },
  });

  const totalAmount = dailyExtras?.reduce((sum, extra) => sum + extra.amount, 0) || 0;
  const memberCount = members?.length || 0;
  const perMemberShare = memberCount > 0 ? totalAmount / memberCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Navbar userRole="Manager" />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Daily Extra</h1>
            <p className="text-sm sm:text-base text-gray-600">Track daily extra expenses divided among members</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
            <Plus className="mr-2 h-4 w-4" />
            Add Daily Extra
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 mb-6">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Extra Amount</p>
                  <p className="text-2xl font-bold text-gray-900">TK {totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Per Member Share</p>
                  <p className="text-2xl font-bold text-blue-600">TK {perMemberShare.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Daily Extra Records</CardTitle>
            <CardDescription className="text-gray-600">All daily extra expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <DailyExtraTable 
                dailyExtras={dailyExtras || []} 
                onDelete={handleDelete}
                showActions={true}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogClose onClose={() => setDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Daily Extra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" {...register("reason")} />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? "Adding..." : "Add Daily Extra"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

