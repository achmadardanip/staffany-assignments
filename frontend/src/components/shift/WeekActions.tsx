import React from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { format, parseISO } from "date-fns";
import { useTheme } from "@mui/material/styles";

interface WeekActionsProps {
  isWeekPublished: boolean;
  publishedAt: string | null;
  shiftsCount: number;
  publishing: boolean;
  onAddShift: () => void;
  onPublish: () => void;
}

const WeekActions: React.FC<WeekActionsProps> = ({
  isWeekPublished,
  publishedAt,
  shiftsCount,
  publishing,
  onAddShift,
  onPublish,
}) => {
  const theme = useTheme();

  return (
    <Box display="flex" alignItems="center" gap={2}>
      {isWeekPublished && publishedAt && (
        <Typography
          sx={{
            color: "#22B8B1",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: "16px", color: "#22B8B1" }} />
          Week published on {format(parseISO(publishedAt), "d MMM yyyy, HH:mm")}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={onAddShift}
        disabled={isWeekPublished}
        sx={{
          backgroundColor: theme.customColors.turquoise,
          color: "white",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: theme.customColors.turquoise,
          },
        }}
      >
        Add Shift
      </Button>
      <Button
        variant="contained"
        onClick={onPublish}
        disabled={isWeekPublished || shiftsCount === 0 || publishing}
        sx={{
          backgroundColor: "white",
          color: theme.customColors.navy,
          fontWeight: 600,
          "&:hover": {
            backgroundColor: "white",
          },
        }}
      >
        {publishing ? <CircularProgress size={20} /> : "Publish"}
      </Button>
    </Box>
  );
};

export default WeekActions;
