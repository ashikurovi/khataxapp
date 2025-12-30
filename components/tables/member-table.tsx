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

interface MemberTableProps {
  members: MemberWithUser[];
  selectedIds?: string[];
  onSelect?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  showCheckboxes?: boolean;
}

export function MemberTable({
  members,
  selectedIds = [],
  onSelect,
  onSelectAll,
  showCheckboxes = false,
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? 7 : 6} className="text-center">
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

