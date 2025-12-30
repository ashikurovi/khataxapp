"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { HeshabTable } from "@/components/tables/heshab-table";
import { apiClient } from "@/lib/api-client";
import { HeshabWithUser, MemberWithUser } from "@/types";
import { Plus, Mail, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const heshabSchema = z.object({
  userId: z.string().min(1, "Member is required"),
  deposit: z.number().min(0),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  totalExpense: z.number().min(0),
  border: z.number().min(0).optional(),
  managerReceivable: z.number().min(0).optional(),
});

type HeshabForm = z.infer<typeof heshabSchema>;

export default function HeshabPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateExpenseDialogOpen, setUpdateExpenseDialogOpen] = useState(false);
  const [selectedHeshabId, setSelectedHeshabId] = useState<string | null>(null);
  const [currentExpense, setCurrentExpense] = useState<number>(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();

  const { data: heshabRecords, isLoading } = useQuery({
    queryKey: ["heshab", month, year],
    queryFn: async () => {
      const response = await apiClient.get<HeshabWithUser[]>(`/heshab?month=${month}&year=${year}`);
      return response.data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser[]>("/members");
      return response.data || [];
    },
  });

  const { mutate: createHeshab, isPending } = useMutation({
    mutationFn: async (data: HeshabForm) => {
      return apiClient.post("/heshab", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["deposit-logs"] });
      setDialogOpen(false);
    },
  });

  const { mutate: sendInvoices, isPending: isSending } = useMutation({
    mutationFn: async () => {
      return apiClient.post("/heshab/send-invoices", { month, year });
    },
    onSuccess: () => {
      alert("Invoices sent successfully!");
    },
  });

  const { mutate: updateExpense, isPending: isUpdatingExpense } = useMutation({
    mutationFn: async (data: { heshabId: string; totalExpense: number }) => {
      return apiClient.put("/heshab", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setUpdateExpenseDialogOpen(false);
      setSelectedHeshabId(null);
      setCurrentExpense(0);
    },
  });

  const handleExportExcel = () => {
    const url = `/api/heshab/export-excel?month=${month}&year=${year}`;
    window.open(url, "_blank");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HeshabForm>({
    resolver: zodResolver(heshabSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      deposit: 0,
      totalExpense: 0,
      border: 0,
      managerReceivable: 0,
    },
  });

  const onSubmit = (data: HeshabForm) => {
    createHeshab(data);
    reset();
  };

  const handleUpdateExpense = (heshabId: string, currentExpense: number) => {
    setSelectedHeshabId(heshabId);
    setCurrentExpense(currentExpense);
    setUpdateExpenseDialogOpen(true);
  };

  const handleUpdateExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpense = parseFloat(formData.get("totalExpense") as string);
    
    if (selectedHeshabId && !isNaN(newExpense) && newExpense >= 0) {
      updateExpense({ heshabId: selectedHeshabId, totalExpense: newExpense });
    }
  };

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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Heshab</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage deposits and send invoices</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-20 bg-white/80 backdrop-blur-md border-white/30"
                placeholder="Month"
              />
              <Input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 bg-white/80 backdrop-blur-md border-white/30"
                placeholder="Year"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => sendInvoices()}
              disabled={isSending}
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : "Send Invoices"}
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              Add Heshab
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Heshab Table</CardTitle>
            <CardDescription className="text-gray-600">
              Monthly heshab records with deposits and balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <HeshabTable 
                heshabRecords={heshabRecords || []} 
                onUpdateExpense={handleUpdateExpense}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogClose onClose={() => setDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Heshab Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Member</Label>
                <select
                  id="userId"
                  {...register("userId")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a member</option>
                  {members?.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <p className="text-sm text-destructive">{errors.userId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    {...register("month", { valueAsNumber: true })}
                  />
                  {errors.month && (
                    <p className="text-sm text-destructive">{errors.month.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2100"
                    {...register("year", { valueAsNumber: true })}
                  />
                  {errors.year && (
                    <p className="text-sm text-destructive">{errors.year.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">New Deposit Amount</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  placeholder="Amount to deposit"
                  {...register("deposit", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  If manager receivable exists, it will be deducted first, then added to deposit
                </p>
                {errors.deposit && (
                  <p className="text-sm text-destructive">{errors.deposit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalExpense">Total Expense</Label>
                <Input
                  id="totalExpense"
                  type="number"
                  step="0.01"
                  {...register("totalExpense", { valueAsNumber: true })}
                />
                {errors.totalExpense && (
                  <p className="text-sm text-destructive">{errors.totalExpense.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="border">Border</Label>
                  <Input
                    id="border"
                    type="number"
                    step="0.01"
                    placeholder="Refundable amount"
                    {...register("border", { valueAsNumber: true })}
                  />
                  {errors.border && (
                    <p className="text-sm text-destructive">{errors.border.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerReceivable">Manager Receivable</Label>
                  <Input
                    id="managerReceivable"
                    type="number"
                    step="0.01"
                    placeholder="Amount owed"
                    {...register("managerReceivable", { valueAsNumber: true })}
                  />
                  {errors.managerReceivable && (
                    <p className="text-sm text-destructive">{errors.managerReceivable.message}</p>
                  )}
                </div>
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
                  {isPending ? "Adding..." : "Add Heshab"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={updateExpenseDialogOpen} onOpenChange={setUpdateExpenseDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[400px] bg-white">
            <DialogClose onClose={() => setUpdateExpenseDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Update Total Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateExpenseSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalExpense">New Total Expense</Label>
                <Input
                  id="totalExpense"
                  name="totalExpense"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={currentExpense}
                  required
                />
                <p className="text-xs text-gray-500">
                  Current expense: TK {currentExpense.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUpdateExpenseDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingExpense} className="w-full sm:w-auto">
                  {isUpdatingExpense ? "Updating..." : "Update Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

