"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { ExpenseTable } from "@/components/tables/expense-table";
import { apiClient } from "@/lib/api-client";
import { DailyExpenseWithUser, DailyExpenseForm } from "@/types";
import { Plus, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PDFGenerator } from "@/lib/pdf-generator";
import { useImageUpload } from "@/hooks/useUpload";
import { Upload, X } from "lucide-react";

const expenseSchema = z.object({
  date: z.string(),
  bazarShop: z.string().min(1),
  totalTK: z.number().min(0),
  extra: z.number().min(0),
  notes: z.string().optional(),
  bazarListUpload: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const queryClient = useQueryClient();
  const { uploadImage, isUploading, uploadError, resetError } = useImageUpload();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await apiClient.get<DailyExpenseWithUser[]>("/expenses");
      return response.data || [];
    },
  });

  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      return apiClient.post("/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDialogOpen(false);
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadedPhotoUrl("");
      resetError();
    },
  });

  const { mutate: bulkDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiClient.post("/bulk-delete", {
        table: "dailyExpenses",
        ids,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["manager-stats"] });
      setSelectedIds([]);
      setShowCheckboxes(false);
      alert("Selected expenses deleted successfully");
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(expenses?.map((e) => e.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one expense to delete");
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedIds.length} expense(s)? This action cannot be undone.`)) {
      bulkDelete(selectedIds);
    }
  };

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

  const onSubmit = (data: ExpenseForm) => {
    createExpense({
      ...data,
      totalTK: Number(data.totalTK),
      extra: Number(data.extra),
      bazarListUpload: uploadedPhotoUrl || data.bazarListUpload || "",
    });
  };

  const handleExportPDF = () => {
    if (!expenses || expenses.length === 0) return;
    const pdf = PDFGenerator.generateDailyExpenseReport(expenses);
    pdf.save(`daily-expense-report-${new Date().toISOString().split("T")[0]}.pdf`);
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Daily Expenses</h1>
            <p className="text-sm sm:text-base text-gray-600">Track and manage daily expenses</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {showCheckboxes && selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : `Delete ${selectedIds.length} Selected`}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowCheckboxes(!showCheckboxes);
                setSelectedIds([]);
              }}
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              {showCheckboxes ? "Cancel Selection" : "Select Items"}
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Expense Table</CardTitle>
            <CardDescription className="text-gray-600">All daily expenses with bazar lists</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <ExpenseTable
                expenses={expenses || []}
                showActions
                showCheckboxes={showCheckboxes}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
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
              setDialogOpen(false);
              reset();
              setPhotoFile(null);
              setPhotoPreview(null);
              setUploadedPhotoUrl("");
              resetError();
            }} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Daily Expense</DialogTitle>
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
                  onClick={() => setDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

