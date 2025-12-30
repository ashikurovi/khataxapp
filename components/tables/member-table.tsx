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
}

export function MemberTable({ members }: MemberTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Institute</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.user.name}</TableCell>
              <TableCell>{member.user.dept}</TableCell>
              <TableCell>{member.user.institute}</TableCell>
              <TableCell>{member.user.phone}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{member.user.role}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

