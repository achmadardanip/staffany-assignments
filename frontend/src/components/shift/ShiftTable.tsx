import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ShiftTableRow from "./ShiftTableRow";

interface ShiftTableProps {
  shifts: Array<{
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  isWeekPublished: boolean;
  onEditShift: (id: string) => void;
  onDeleteShift: (id: string) => void;
}

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  isWeekPublished,
  onEditShift,
  onDeleteShift,
}) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Start Time</TableCell>
          <TableCell>End Time</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {shifts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center">
              <Typography color="textSecondary">No shifts found</Typography>
            </TableCell>
          </TableRow>
        ) : (
          shifts.map((shift) => (
            <ShiftTableRow
              key={shift.id}
              shift={shift}
              isWeekPublished={isWeekPublished}
              onEdit={onEditShift}
              onDelete={onDeleteShift}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ShiftTable;
