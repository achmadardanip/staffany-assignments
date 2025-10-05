import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useHistory, useLocation } from "react-router-dom";
import { format, parseISO, addWeeks, startOfWeek } from "date-fns";
import { useTheme } from "@mui/material/styles";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage } from "../helper/error";
import {
  deleteShiftById,
  getShifts,
  getWeekByStart,
  publishWeek as publishWeekRequest,
} from "../helper/api/shift";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  removeShift,
  setError,
  setLoading,
  setSelectedWeek,
  setShifts,
  setWeekInfo,
  setPublishing,
} from "../store/slices/scheduleSlice";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const Shift: FunctionComponent = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const history = useHistory();
  const location = useLocation();

  const {
    selectedWeekStart,
    selectedWeekEnd,
    shifts,
    weekInfo,
    loading,
    publishing,
    error,
  } = useAppSelector((state) => state.schedule);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState<Date | null>(null);
  const initialWeekRef = useRef(selectedWeekStart);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const weekParam = params.get("week");

    if (weekParam) {
      dispatch(setSelectedWeek(weekParam));
    } else if (initialWeekRef.current) {
      history.replace({
        pathname: location.pathname,
        search: `?week=${initialWeekRef.current}`,
      });
    }
  }, [dispatch, history, location.pathname, location.search]);

  const fetchSchedule = useCallback(
    async (weekStart: string) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const [shiftResponse, weekResponse] = await Promise.all([
          getShifts({ weekStartDate: weekStart }),
          getWeekByStart(weekStart),
        ]);
        dispatch(setShifts(shiftResponse.results));
        dispatch(setWeekInfo(weekResponse.results));
      } catch (err) {
        const message = getErrorMessage(err);
        dispatch(setError(message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!selectedWeekStart) {
      return;
    }

    setDatePickerValue(parseISO(selectedWeekStart));
    fetchSchedule(selectedWeekStart);
  }, [fetchSchedule, selectedWeekStart]);

  const weekRangeLabel = useMemo(() => {
    if (!selectedWeekStart || !selectedWeekEnd) {
      return "";
    }

    const startLabel = format(parseISO(selectedWeekStart), "MMM d");
    const endLabel = format(parseISO(selectedWeekEnd), "MMM d");
    return `${startLabel} - ${endLabel}`;
  }, [selectedWeekStart, selectedWeekEnd]);

  const handleWeekNavigation = (weeksToShift: number) => {
    if (!selectedWeekStart) {
      return;
    }

    const nextWeekStart = addWeeks(parseISO(selectedWeekStart), weeksToShift);
    const normalizedStart = format(startOfWeek(nextWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
    history.push({ pathname: "/shift", search: `?week=${normalizedStart}` });
  };

  const handleWeekSelection = (value: Date | null) => {
    setIsDatePickerOpen(false);
    if (!value) {
      return;
    }

    const normalizedStart = format(startOfWeek(value, { weekStartsOn: 1 }), "yyyy-MM-dd");
    history.push({ pathname: "/shift", search: `?week=${normalizedStart}` });
  };

  const handleAddShift = () => {
    history.push(`/shift/add?week=${selectedWeekStart}`);
  };

  const handleEditShift = (id: string) => {
    history.push(`/shift/${id}/edit?week=${selectedWeekStart}`);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleteLoading(true);
      dispatch(setError(null));
      await deleteShiftById(deleteId);
      dispatch(removeShift(deleteId));
      closeDeleteDialog();
    } catch (err) {
      const message = getErrorMessage(err);
      dispatch(setError(message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPublishDialog = () => {
    setPublishDialogOpen(true);
  };

  const closePublishDialog = () => {
    setPublishDialogOpen(false);
  };

  const confirmPublish = async () => {
    try {
      dispatch(setPublishing(true));
      dispatch(setError(null));
      await publishWeekRequest(selectedWeekStart);
      closePublishDialog();
      await fetchSchedule(selectedWeekStart);
    } catch (err) {
      const message = getErrorMessage(err);
      dispatch(setError(message));
    } finally {
      dispatch(setPublishing(false));
    }
  };

  const isWeekPublished = weekInfo?.isPublished ?? false;

  const publishedLabel = useMemo(() => {
    if (!weekInfo?.publishedAt) {
      return "";
    }

    return `Week published on ${format(parseISO(weekInfo.publishedAt), "d MMM yyyy, HH:mm")}`;
  }, [weekInfo?.publishedAt]);

  const renderTableBody = () => {
    if (!shifts.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
            There are no records to display
          </TableCell>
        </TableRow>
      );
    }

    return shifts.map((shift) => (
      <TableRow key={shift.id}>
        <TableCell>{shift.name}</TableCell>
        <TableCell>{format(parseISO(shift.date), "yyyy-MM-dd")}</TableCell>
        <TableCell>{shift.startTime}</TableCell>
        <TableCell>{shift.endTime}</TableCell>
        <TableCell align="right">
          <IconButton
            size="small"
            aria-label="edit"
            onClick={() => handleEditShift(shift.id)}
            disabled={isWeekPublished}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="delete"
            onClick={() => handleDeleteClick(shift.id)}
            disabled={isWeekPublished}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ minWidth: 275, overflow: "hidden" }}>
            <Box
              sx={{
                backgroundColor: theme.customColors.navy,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                py: 2,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  color="inherit"
                  onClick={() => handleWeekNavigation(-1)}
                  aria-label="previous week"
                  size="small"
                >
                  <ChevronLeftIcon sx={{ color: "white" }} />
                </IconButton>
                <Button
                  variant="text"
                  onClick={() => setIsDatePickerOpen(true)}
                  startIcon={<CalendarMonthIcon sx={{ color: "white" }} />}
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: 18,
                  }}
                >
                  {weekRangeLabel}
                </Button>
                <IconButton
                  color="inherit"
                  onClick={() => handleWeekNavigation(1)}
                  aria-label="next week"
                  size="small"
                >
                  <ChevronRightIcon sx={{ color: "white" }} />
                </IconButton>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                {isWeekPublished && publishedLabel && (
                  <Typography
                    sx={{
                      color: theme.customColors.turquoise,
                      fontWeight: 600,
                    }}
                  >
                    {publishedLabel}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={handleAddShift}
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
                  onClick={openPublishDialog}
                  disabled={isWeekPublished || shifts.length === 0 || publishing}
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
            </Box>
            <CardContent>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => dispatch(setError(null))}
                >
                  {error}
                </Alert>
              )}
              {loading && <LinearProgress sx={{ mb: 2 }} />}
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
                <TableBody>{renderTableBody()}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <DatePicker
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={datePickerValue}
        onChange={handleWeekSelection}
        slotProps={{
          textField: { sx: { display: "none" } },
        }}
      />
      <ConfirmDialog
        title="Delete Confirmation"
        description="Do you want to delete this shift?"
        onClose={closeDeleteDialog}
        open={deleteDialogOpen}
        onYes={confirmDelete}
        loading={deleteLoading}
        confirmLabel="Delete"
      />
      <ConfirmDialog
        title="Publish Week"
        description="Are you sure you want to publish?"
        onClose={closePublishDialog}
        open={publishDialogOpen}
        onYes={confirmPublish}
        loading={publishing}
        confirmLabel="Publish"
      />
    </LocalizationProvider>
  );
};

export default Shift;
