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
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [depositValue, setDepositValue] = useState<number>(0);
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
      perExtra: heshab.perExtra, // Not editable but kept for display
      totalExpense: heshab.totalExpense, // Not editable but kept for display
      border: heshab.currentBalance > 0 ? heshab.currentBalance : 0, // Not editable but kept for display
      managerReceivable: heshab.due, // Not editable but kept for display
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleSave = (heshabId: string) => {
    if (editValues && onUpdate) {
      // Send deposit, totalExpense, border, and managerReceivable (all editable)
      // perExtra is auto-calculated
      onUpdate(heshabId, {
        deposit: editValues.deposit,
        totalExpense: editValues.totalExpense,
        border: editValues.border,
        managerReceivable: editValues.managerReceivable,
      });
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

  const handleDepositEdit = (heshab: HeshabWithUser) => {
    setEditingDepositId(heshab.id);
    setDepositValue(heshab.deposit);
  };

  const handleDepositSave = (heshabId: string) => {
    if (onUpdate && depositValue >= 0) {
      onUpdate(heshabId, {
        deposit: depositValue,
      });
      setEditingDepositId(null);
      setDepositValue(0);
    }
  };

  const handleDepositCancel = () => {
    setEditingDepositId(null);
    setDepositValue(0);
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
            const hasPositiveBalance = heshab.currentBalance > 0;
            const hasNegativeBalance = heshab.due > 0;
            return (
              <TableRow 
                key={heshab.id}
                className={hasPositiveBalance ? "border-l-4 border-l-green-500" : hasNegativeBalance ? "border-l-4 border-l-red-500" : ""}
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{heshab.user.name}</TableCell>
                <TableCell>
                  {editingDepositId === heshab.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={depositValue}
                        onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleDepositSave(heshab.id);
                          } else if (e.key === "Escape") {
                            handleDepositCancel();
                          }
                        }}
                        className="w-24 h-8"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDepositSave(heshab.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDepositCancel}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleDepositEdit(heshab)}
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title="Click to edit deposit"
                    >
                      TK {heshab.deposit.toFixed(2)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">TK {heshab.perExtra.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 ml-1">(auto)</span>
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
                    <Badge variant="secondary" className="border-2 border-green-500 bg-green-50 text-green-700">
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
                    <Badge variant="destructive" className="border-2 border-red-500">
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

