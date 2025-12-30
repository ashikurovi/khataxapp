"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { MemberTable } from "@/components/tables/member-table";
import { apiClient } from "@/lib/api-client";
import { MemberWithUser } from "@/types";
import { Plus, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserRole } from "@/types";
import { toast } from "sonner";

const memberSchema = z.object({
  name: z.string().min(2),
  dept: z.string().min(2),
  institute: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

type MemberForm = z.infer<typeof memberSchema>;

export default function MembersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser[]>("/members");
      return response.data || [];
    },
  });

  const { mutate: createMember, isPending } = useMutation({
    mutationFn: async (data: MemberForm) => {
      return apiClient.post("/members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setDialogOpen(false);
    },
  });

  const { mutate: bulkDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiClient.post("/bulk-delete", {
        table: "members",
        ids,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["manager-stats"] });
      setSelectedIds([]);
      setShowCheckboxes(false);
      alert("Selected members deleted successfully");
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
      setSelectedIds(members?.map((m) => m.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one member to delete");
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedIds.length} member(s)? This will also delete their associated user accounts. This action cannot be undone.`)) {
      bulkDelete(selectedIds);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      role: UserRole.MEMBER,
    },
  });

  const phoneValue = watch("phone");

  const handleAddPhoneFromContacts = async () => {
    // Show toast notification
    toast.info("Add Phone Number", {
      description: "Click the button to add phone from contacts",
      duration: 2000,
    });

    try {
      // Check if Contacts API is available (Chrome/Edge)
      if ("contacts" in navigator && "select" in navigator.contacts) {
        const contacts = await (navigator.contacts as any).select(["tel"], { multiple: false });
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

  const onSubmit = (data: MemberForm) => {
    createMember(data);
    reset();
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Members</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage all members</p>
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
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Member List</CardTitle>
            <CardDescription className="text-gray-600">Member details and information</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <MemberTable
                members={members || []}
                showCheckboxes={showCheckboxes}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white">
            <DialogClose onClose={() => setDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Input id="dept" {...register("dept")} />
                {errors.dept && (
                  <p className="text-sm text-destructive">{errors.dept.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institute">Institute</Label>
                <Input id="institute" {...register("institute")} />
                {errors.institute && (
                  <p className="text-sm text-destructive">{errors.institute.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex gap-2">
                  <Input 
                    id="phone" 
                    {...register("phone")} 
                    placeholder="+8801234567890"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddPhoneFromContacts}
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

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  {...register("role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={UserRole.MEMBER}>Member</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
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
                  {isPending ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

