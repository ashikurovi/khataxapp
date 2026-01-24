"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { apiClient } from "@/lib/api-client";
import { MemberWithUser, DepositLogWithUser, UserRole } from "@/types";
import { Download, Wallet, History, Clock, Receipt, Plus, Upload, X } from "lucide-react";
import { PDFGenerator } from "@/lib/pdf-generator";
import { DepositLogTable } from "@/components/tables/deposit-log-table";
import { format } from "date-fns";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload } from "@/hooks/useUpload";

const expenseSchema = z.object({
  date: z.string(),
  bazarShop: z.string().min(1),
  totalTK: z.number().min(0),
  extra: z.number().min(0),
  notes: z.string().optional(),
  bazarListUpload: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function DashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const queryClient = useQueryClient();
  const { uploadImage, isUploading, uploadError, resetError } = useImageUpload();

  const { data: memberData, isLoading } = useQuery({
    queryKey: ["member-dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser>("/members/me");
      return response.data;
    },
  });

  const { data: depositLogs, isLoading: depositLogsLoading } = useQuery({
    queryKey: ["deposit-logs", memberData?.userId, currentMonth, currentYear],
    queryFn: async () => {
      if (!memberData) return [];
      const params = new URLSearchParams();
      params.append("userId", memberData.userId);
      params.append("month", currentMonth.toString());
      params.append("year", currentYear.toString());

      const response = await apiClient.get<DepositLogWithUser[]>(
        `/heshab/deposit-logs?${params.toString()}`
      );
      return response.data || [];
    },
    enabled: !!memberData,
  });

  const handleDownloadInvoice = () => {
    if (!memberData) return;

    const currentDate = new Date();
    const invoiceData = {
      member: memberData,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      transactions: [],
      totalDeposit: memberData.totalDeposit,
      totalExpense: memberData.totalExpense,
      balance: memberData.balanceDue,
      border: memberData.border,
      managerReceivable: memberData.managerReceivable,
    };

    const pdf = PDFGenerator.generateInvoice(invoiceData);
    pdf.save(`invoice-${memberData.user.name}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.pdf`);
  };

  const { mutate: createExpense, isPending: isCreatingExpense } = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      return apiClient.post("/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["member-dashboard"] });
      setExpenseDialogOpen(false);
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadedPhotoUrl("");
      resetError();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      extra: 0,
      bazarListUpload: "",
    },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    resetError();
    const result = await uploadImage(file);
    if (result) {
      setUploadedPhotoUrl(result.url);
      setValue("bazarListUpload", result.url);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      if (uploadError) {
        alert(uploadError);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl("");
    setValue("bazarListUpload", "");
    resetError();
  };

  const onSubmitExpense = (data: ExpenseForm) => {
    createExpense({
      ...data,
      totalTK: Number(data.totalTK),
      extra: Number(data.extra),
      bazarListUpload: uploadedPhotoUrl || data.bazarListUpload || "",
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-gray-600">No member data found. Please contact the manager.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (
    memberData.user.role !== UserRole.SUPER_ADMIN &&
    memberData.user.role !== UserRole.MANAGER &&
    memberData.user.role !== UserRole.ADMIN
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg border-red-200">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view this dashboard.</p>
              <p className="text-sm text-gray-400 mt-2">Only authorized personnel can access this area.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Navbar userRole="Member" userName={memberData.user.name} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Welcome back, {memberData.user.name}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Your financial overview and account details</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </Button>
            <Button
              onClick={() => setExpenseDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Deposit</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.totalDeposit.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Total amount deposited</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Previous Due</CardTitle>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.previousDue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Previous month due</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Per Extra</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.perExtra.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Extra charges per person</p>
            </CardContent>
          </Card>


        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                {memberData.user.picture && (
                  <img
                    src={memberData.user.picture}
                    alt={memberData.user.name}
                    className="h-20 w-20 rounded-full border-4 border-blue-200 shadow-md object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-gray-900">Member Information</CardTitle>
                  <CardDescription className="text-gray-600">Your profile and account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.dept}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Institute</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.institute}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.phone}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Per Extra</p>
                  <p className="text-lg font-semibold text-gray-900">TK {memberData.perExtra.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Deposit History</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your deposits for {format(new Date(currentYear, currentMonth - 1, 1), "MMMM yyyy")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {depositLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : depositLogs && depositLogs.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto">
                    <DepositLogTable depositLogs={depositLogs} showFooter={false} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total This Month:</span>
                      <span className="text-lg font-bold text-blue-600">
                        TK {depositLogs.reduce((sum, log) => sum + log.amount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No deposits found for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
          setExpenseDialogOpen(open);
          if (!open) {
            reset();
            setPhotoFile(null);
            setPhotoPreview(null);
            setUploadedPhotoUrl("");
            resetError();
          }
        }}>
          <DialogContent className="w-[90vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogClose onClose={() => {
              setExpenseDialogOpen(false);
              reset();
              setPhotoFile(null);
              setPhotoPreview(null);
              setUploadedPhotoUrl("");
              resetError();
            }} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Daily Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitExpense)} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bazarShop">Bazar/Shop</Label>
                <Input id="bazarShop" {...register("bazarShop")} />
                {errors.bazarShop && (
                  <p className="text-sm text-destructive">{errors.bazarShop.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalTK">Total TK</Label>
                  <Input
                    id="totalTK"
                    type="number"
                    step="0.01"
                    {...register("totalTK", { valueAsNumber: true })}
                  />
                  {errors.totalTK && (
                    <p className="text-sm text-destructive">{errors.totalTK.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra">Extra</Label>
                  <Input
                    id="extra"
                    type="number"
                    step="0.01"
                    {...register("extra", { valueAsNumber: true })}
                  />
                  {errors.extra && (
                    <p className="text-sm text-destructive">{errors.extra.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register("notes")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Bazar List Photo (Optional)</Label>
                {!photoPreview ? (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="photo"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 32MB</p>
                      </div>
                      <input
                        id="photo"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <p className="text-white">Uploading...</p>
                      </div>
                    )}
                  </div>
                )}
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpenseDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingExpense} className="w-full sm:w-auto">
                  {isCreatingExpense ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
      <PWAInstallPrompt />
    </div>
  );
}

