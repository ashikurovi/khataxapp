"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BazarListWithUser } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";

interface BazarTableProps {
  bazarList: BazarListWithUser[];
  onDownloadPDF?: (bazar: BazarListWithUser) => void;
  onSendEmail?: (bazar: BazarListWithUser) => void;
}

export function BazarTable({
  bazarList,
  onDownloadPDF,
  onSendEmail,
}: BazarTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bazar #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Assigned Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bazarList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No bazar schedule found
              </TableCell>
            </TableRow>
          ) : (
            bazarList.map((bazar) => (
              <TableRow key={bazar.id}>
                <TableCell className="font-medium">{bazar.bazarNo}</TableCell>
                <TableCell>
                  {format(new Date(bazar.date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{bazar.assignedToUser.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      bazar.status === "Completed" ? "default" : "secondary"
                    }
                  >
                    {bazar.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onDownloadPDF && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownloadPDF(bazar)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onSendEmail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSendEmail(bazar)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

