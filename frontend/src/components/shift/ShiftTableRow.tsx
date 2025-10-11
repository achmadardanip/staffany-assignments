import React from "react";
import { IconButton, TableCell, TableRow } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { format, parseISO } from "date-fns";

interface ShiftTableRowProps {
  shift: {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  isWeekPublished: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ShiftTableRow: React.FC<ShiftTableRowProps> = ({
  shift,
  isWeekPublished,
  onEdit,
  onDelete,
}) => {
  return (
    <TableRow key={shift.id}>
      <TableCell>{shift.name}</TableCell>
      <TableCell>
        {format(parseISO(shift.date), "EEE, MMM d, yyyy")}
      </TableCell>
      <TableCell>
        {format(parseISO(`1970-01-01T${shift.startTime}`), "h:mm a")}
      </TableCell>
      <TableCell>
        {format(parseISO(`1970-01-01T${shift.endTime}`), "h:mm a")}
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          onClick={() => onEdit(shift.id)}
          disabled={isWeekPublished}
          sx={{ mr: 1 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(shift.id)}
          disabled={isWeekPublished}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default ShiftTableRow;
