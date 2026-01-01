"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { HeshabTable } from "@/components/tables/heshab-table";
import { apiClient } from "@/lib/api-client";
import { HeshabWithUser, MemberWithUser } from "@/types";
import { Plus, Mail, Download, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ReactSelect, ReactSelectOption } from "@/components/ui/react-select";

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
  const [searchTerm, setSearchTerm] = useState("");
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
      return apiClient.patch("/heshab", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setUpdateExpenseDialogOpen(false);
      setSelectedHeshabId(null);
      setCurrentExpense(0);
    },
  });

  const { mutate: updateHeshab, isPending: isUpdatingHeshab } = useMutation({
    mutationFn: async (data: {
      heshabId: string;
      deposit?: number;
      perExtra?: number;
      totalExpense?: number;
      border?: number;
      managerReceivable?: number;
    }) => {
      return apiClient.patch("/heshab", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heshab"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const handleUpdateHeshab = (
    heshabId: string,
    data: {
      deposit?: number;
      perExtra?: number;
      totalExpense?: number;
      border?: number;
      managerReceivable?: number;
    }
  ) => {
    updateHeshab({ heshabId, ...data });
  };

  const handleExportExcel = () => {
    const url = `/api/heshab/export-excel?month=${month}&year=${year}`;
    window.open(url, "_blank");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<HeshabForm>({
    mode: "onChange",
    resolver: zodResolver(heshabSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      deposit: 0,
      totalExpense: 0, // Will be auto-calculated from approved expenses
      border: 0, // Will be auto-calculated
      managerReceivable: 0, // Will be auto-calculated
    },
  });

  const selectedUserId = watch("userId");

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

  const filteredHeshabRecords = useMemo(() => {
    if (!heshabRecords) return [];
    if (!searchTerm.trim()) return heshabRecords;
    
    return heshabRecords.filter((heshab) =>
      heshab.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [heshabRecords, searchTerm]);

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
              <ReactSelect
                options={[
                  { value: 1, label: "January" },
                  { value: 2, label: "February" },
                  { value: 3, label: "March" },
                  { value: 4, label: "April" },
                  { value: 5, label: "May" },
                  { value: 6, label: "June" },
                  { value: 7, label: "July" },
                  { value: 8, label: "August" },
                  { value: 9, label: "September" },
                  { value: 10, label: "October" },
                  { value: 11, label: "November" },
                  { value: 12, label: "December" },
                ]}
                value={{
                  value: month,
                  label: new Date(2000, month - 1, 1).toLocaleString("default", {
                    month: "long",
                  }),
                }}
                onChange={(option) => setMonth((option?.value as number) || 1)}
                placeholder="Month"
                isSearchable={false}
                className="w-32"
              />
              <ReactSelect
                options={Array.from({ length: 15 }, (_, i) => {
                  const yearVal = 2020 + i;
                  return { value: yearVal, label: yearVal.toString() };
                })}
                value={{ value: year, label: year.toString() }}
                onChange={(option) => setYear((option?.value as number) || new Date().getFullYear())}
                placeholder="Year"
                isSearchable={false}
                className="w-28"
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-gray-900">Heshab Table</CardTitle>
                <CardDescription className="text-gray-600">
                  Monthly heshab records with deposits and balances
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by member name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-md border-white/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <HeshabTable 
                heshabRecords={filteredHeshabRecords} 
                onUpdate={handleUpdateHeshab}
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
                <ReactSelect
                  options={
                    members?.map((member) => ({
                      value: member.userId,
                      label: member.user.name,
                    })) || []
                  }
                  value={
                    selectedUserId
                      ? {
                          value: selectedUserId,
                          label:
                            members?.find((m) => m.userId === selectedUserId)?.user.name ||
                            "Select a member",
                        }
                      : null
                  }
                  onChange={(option) => {
                    setValue("userId", option?.value as string || "", { shouldValidate: true });
                  }}
                  placeholder="Select a member"
                  isSearchable={true}
                />
                {errors.userId && (
                  <p className="text-sm text-destructive">{errors.userId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <ReactSelect
                    options={[
                      { value: 1, label: "January" },
                      { value: 2, label: "February" },
                      { value: 3, label: "March" },
                      { value: 4, label: "April" },
                      { value: 5, label: "May" },
                      { value: 6, label: "June" },
                      { value: 7, label: "July" },
                      { value: 8, label: "August" },
                      { value: 9, label: "September" },
                      { value: 10, label: "October" },
                      { value: 11, label: "November" },
                      { value: 12, label: "December" },
                    ]}
                    value={
                      watch("month")
                        ? {
                            value: watch("month"),
                            label: new Date(2000, watch("month") - 1, 1).toLocaleString("default", {
                              month: "long",
                            }),
                          }
                        : null
                    }
                    onChange={(option) => {
                      setValue("month", (option?.value as number) || 1, { shouldValidate: true });
                    }}
                    placeholder="Select Month"
                    isSearchable={false}
                  />
                  {errors.month && (
                    <p className="text-sm text-destructive">{errors.month.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <ReactSelect
                    options={Array.from({ length: 15 }, (_, i) => {
                      const year = 2020 + i;
                      return { value: year, label: year.toString() };
                    })}
                    value={
                      watch("year")
                        ? {
                            value: watch("year"),
                            label: watch("year").toString(),
                          }
                        : null
                    }
                    onChange={(option) => {
                      setValue("year", (option?.value as number) || new Date().getFullYear(), {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="Select Year"
                    isSearchable={false}
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
                <p className="text-xs text-gray-500">
                  Enter total expense manually (perExtra is automatically calculated from daily extras)
                </p>
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
                  <p className="text-xs text-gray-500">
                    Enter manually or leave empty to auto-calculate: deposit - (perExtra + totalExpense) if positive
                  </p>
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
                  <p className="text-xs text-gray-500">
                    Enter manually or leave empty to auto-calculate: (perExtra + totalExpense) - deposit if negative
                  </p>
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

