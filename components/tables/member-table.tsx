"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberWithUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface MemberTableProps {
  members: MemberWithUser[];
  selectedIds?: string[];
  onSelect?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  showCheckboxes?: boolean;
  onEdit?: (member: MemberWithUser) => void;
  onDelete?: (memberId: string) => void;
  showActions?: boolean;
}

export function MemberTable({
  members,
  selectedIds = [],
  onSelect,
  onSelectAll,
  showCheckboxes = false,
  onEdit,
  onDelete,
  showActions = false,
}: MemberTableProps) {
  const allSelected = members.length > 0 && members.every(m => selectedIds.includes(m.id));
  const someSelected = members.some(m => selectedIds.includes(m.id));

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="cursor-pointer"
                />
              </TableHead>
            )}
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Institute</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? (showActions ? 8 : 7) : (showActions ? 7 : 6)} className="text-center">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                {showCheckboxes && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={(e) => onSelect?.(member.id, e.target.checked)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{member.user.name}</TableCell>
                <TableCell>{member.user.dept}</TableCell>
                <TableCell>{member.user.institute}</TableCell>
                <TableCell>{member.user.phone}</TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{member.user.role}</Badge>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(member)}
                        className="h-8 w-8"
                        title="Edit member"
                        disabled={!onEdit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(member.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete member"
                        disabled={!onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

