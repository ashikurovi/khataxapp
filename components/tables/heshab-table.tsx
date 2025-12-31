"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { HeshabWithUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Check, X } from "lucide-react";

interface HeshabTableProps {
  heshabRecords: HeshabWithUser[];
  showFooter?: boolean;
  onUpdate?: (heshabId: string, data: {
    deposit?: number;
    perExtra?: number;
    totalExpense?: number;
    border?: number;
    managerReceivable?: number;
  }) => void;
  onUpdateExpense?: (heshabId: string, currentExpense: number) => void;
}

export function HeshabTable({ heshabRecords, showFooter = true, onUpdate, onUpdateExpense }: HeshabTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    deposit: number;
    perExtra: number;
    totalExpense: number;
    border: number;
    managerReceivable: number;
  } | null>(null);

  const totalDeposit = heshabRecords.reduce((sum, h) => sum + h.deposit, 0);
  const totalPerExtra = heshabRecords.reduce((sum, h) => sum + h.perExtra, 0);
  const totalExpense = heshabRecords.reduce((sum, h) => sum + h.totalExpense, 0);
  const totalBorder = heshabRecords.reduce((sum, h) => sum + (h.currentBalance > 0 ? h.currentBalance : 0), 0);
  const totalManagerReceivable = heshabRecords.reduce((sum, h) => sum + h.due, 0);

  const handleEdit = (heshab: HeshabWithUser) => {
    setEditingId(heshab.id);
    setEditValues({
      deposit: heshab.deposit,
      perExtra: heshab.perExtra,
      totalExpense: heshab.totalExpense,
      border: heshab.currentBalance > 0 ? heshab.currentBalance : 0,
      managerReceivable: heshab.due,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleSave = (heshabId: string) => {
    if (editValues && onUpdate) {
      onUpdate(heshabId, editValues);
      setEditingId(null);
      setEditValues(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editValues) {
      setEditValues({
        ...editValues,
        [field]: parseFloat(value) || 0,
      });
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Deposit</TableHead>
            <TableHead>Per Extra</TableHead>
            <TableHead>Total Expense</TableHead>
            <TableHead>Border</TableHead>
            <TableHead>Manager Receivable</TableHead>
            {onUpdate && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {heshabRecords.map((heshab, index) => {
            const isEditing = editingId === heshab.id;
            return (
              <TableRow key={heshab.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{heshab.user.name}</TableCell>
                <TableCell>
                  {isEditing && editValues ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.deposit}
                      onChange={(e) => handleInputChange("deposit", e.target.value)}
                      className="w-24 h-8"
                    />
                  ) : (
                    `TK ${heshab.deposit.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && editValues ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.perExtra}
                      onChange={(e) => handleInputChange("perExtra", e.target.value)}
                      className="w-24 h-8"
                    />
                  ) : (
                    `TK ${heshab.perExtra.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && editValues ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.totalExpense}
                      onChange={(e) => handleInputChange("totalExpense", e.target.value)}
                      className="w-24 h-8"
                    />
                  ) : (
                    `TK ${heshab.totalExpense.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && editValues ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.border}
                      onChange={(e) => handleInputChange("border", e.target.value)}
                      className="w-24 h-8"
                    />
                  ) : heshab.currentBalance > 0 ? (
                    <Badge variant="secondary">
                      TK {heshab.currentBalance.toFixed(2)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && editValues ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.managerReceivable}
                      onChange={(e) => handleInputChange("managerReceivable", e.target.value)}
                      className="w-24 h-8"
                    />
                  ) : heshab.due > 0 ? (
                    <Badge variant="destructive">
                      TK {heshab.due.toFixed(2)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {onUpdate && (
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSave(heshab.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(heshab)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
        {showFooter && (
          <TableFooter>
            <TableRow>
              <TableCell></TableCell>
              <TableCell className="text-right font-bold">
                Totals:
              </TableCell>
              <TableCell className="font-bold">TK {totalDeposit.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalPerExtra.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalExpense.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalBorder.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalManagerReceivable.toFixed(2)}</TableCell>
              {onUpdate && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

