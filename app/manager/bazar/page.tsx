"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { BazarTable } from "@/components/tables/bazar-table";
import { apiClient } from "@/lib/api-client";
import { BazarListWithUser, User } from "@/types";
import { Calendar, Download, Mail } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFGenerator } from "@/lib/pdf-generator";
import { EmailService } from "@/lib/email";

export default function BazarPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();

  const { data: bazarList, isLoading } = useQuery({
    queryKey: ["bazar-list"],
    queryFn: async () => {
      const response = await apiClient.get<BazarListWithUser[]>("/bazar");
      return response.data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await apiClient.get<User[]>("/members");
      return response.data || [];
    },
  });

  const { mutate: generateSchedule, isPending } = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      return apiClient.post("/bazar/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bazar-list"] });
      setDialogOpen(false);
    },
  });

  const { mutate: sendBulkEmail, isPending: isSendingBulkEmail } = useMutation({
    mutationFn: async () => {
      return apiClient.post("/bazar/send-bulk-email", {});
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data?.success) {
        alert(`Bulk email sent successfully!\n${data.message}`);
      }
    },
    onError: (error: any) => {
      alert(`Failed to send bulk emails: ${error?.response?.data?.error || error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!startDate || !endDate) return;
    generateSchedule({ startDate, endDate });
  };

  const handleDownloadPDF = (bazar: BazarListWithUser) => {
    const pdf = PDFGenerator.generateBazarList([bazar]);
    pdf.save(`bazar-${bazar.bazarNo}-${bazar.date}.pdf`);
  };

  const handleSendEmail = async (bazar: BazarListWithUser) => {
    // This would call an API endpoint to send email
    await apiClient.post(`/bazar/${bazar.id}/send-email`, {});
  };

  const handleDownloadAllPDF = () => {
    if (!bazarList || bazarList.length === 0) return;
    const pdf = PDFGenerator.generateBazarList(bazarList);
    pdf.save(`bazar-schedule-${new Date().toISOString().split("T")[0]}.pdf`);
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Bazar Schedule</h1>
            <p className="text-sm sm:text-base text-gray-600">Auto-generated bazar list with 4-day gap</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleDownloadAllPDF} 
              disabled={!bazarList || bazarList.length === 0}
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download All PDF</span>
              <span className="sm:hidden">Download PDF</span>
            </Button>
            <Button 
              onClick={() => sendBulkEmail()} 
              disabled={isSendingBulkEmail || !bazarList || bazarList.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingBulkEmail ? "Sending..." : "Send Bulk Email"}
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
              <Calendar className="mr-2 h-4 w-4" />
              Generate Schedule
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Bazar List</CardTitle>
            <CardDescription className="text-gray-600">
              Auto-generated schedule with 4-day intervals, skipping semester breaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <BazarTable
                bazarList={bazarList || []}
                onDownloadPDF={handleDownloadPDF}
                onSendEmail={handleSendEmail}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogClose onClose={() => setDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Generate Bazar Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
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
                <Button onClick={handleGenerate} disabled={isPending || !startDate || !endDate} className="w-full sm:w-auto">
                  {isPending ? "Generating..." : "Generate Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

