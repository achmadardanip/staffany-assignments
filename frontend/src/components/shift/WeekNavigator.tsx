import React from "react";
import { Box, Button, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface WeekNavigatorProps {
  weekRangeLabel: string;
  isWeekPublished: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenCalendar: () => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekRangeLabel,
  isWeekPublished,
  onPrevWeek,
  onNextWeek,
  onOpenCalendar,
}) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <IconButton
        color="inherit"
        onClick={onPrevWeek}
        aria-label="previous week"
        size="small"
      >
        <ChevronLeftIcon sx={{ color: "#374151" }} />
      </IconButton>
      <Button
        variant="text"
        onClick={onOpenCalendar}
        startIcon={
          isWeekPublished ? (
            <CheckCircleIcon sx={{ color: "#22B8B1" }} />
          ) : (
            <CalendarMonthIcon sx={{ color: "#374151" }} />
          )
        }
        sx={{
          color: isWeekPublished ? "#22B8B1" : "#374151",
          fontWeight: isWeekPublished ? 700 : 600,
          textTransform: "none",
          fontSize: 18,
          position: "relative",
          "&:hover": {
            backgroundColor: isWeekPublished
              ? "rgba(34, 184, 177, 0.04)"
              : "rgba(55, 65, 81, 0.04)",
          },
        }}
      >
        {weekRangeLabel}
      </Button>
      <IconButton
        color="inherit"
        onClick={onNextWeek}
        aria-label="next week"
        size="small"
      >
        <ChevronRightIcon sx={{ color: "#374151" }} />
      </IconButton>
    </Box>
  );
};

export default WeekNavigator;
