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
  TablePagination,
  Typography,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const initialWeekRef = useRef(selectedWeekStart);

  // Handle ESC key for closing date picker
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDatePickerOpen) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDatePickerOpen]);

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated shifts
  const paginatedShifts = shifts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                color: "#374151",
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
                  <ChevronLeftIcon sx={{ color: "#374151" }} />
                </IconButton>
                <Button
                  variant="text"
                  onClick={() => setIsDatePickerOpen(true)}
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
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: isWeekPublished ? 'rgba(34, 184, 177, 0.04)' : 'rgba(55, 65, 81, 0.04)',
                    },
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
                  <ChevronRightIcon sx={{ color: "#374151" }} />
                </IconButton>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                {isWeekPublished && weekInfo?.publishedAt && (
                  <Typography
                    sx={{
                      color: '#22B8B1',
                      fontWeight: 600,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: '16px', color: '#22B8B1' }} />
                    Week published on {format(parseISO(weekInfo.publishedAt), "d MMM yyyy, HH:mm")}
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
                <TableBody>
                  {paginatedShifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">
                          No shifts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.name}</TableCell>
                        <TableCell>
                          {format(parseISO(shift.date), "EEE, MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{format(parseISO(`1970-01-01T${shift.startTime}`), "h:mm a")}</TableCell>
                        <TableCell>{format(parseISO(`1970-01-01T${shift.endTime}`), "h:mm a")}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditShift(shift.id)}
                            disabled={isWeekPublished}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(shift.id)}
                            disabled={isWeekPublished}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination inside card */}
              <TablePagination
                component="div"
                count={shifts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 15, 20, 25, 50, 100]}
                sx={{
                  height: '48px',
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  backgroundColor: 'white',
                  border: 'none',
                  borderTop: 'none',
                  mt: 1,
                  '& .MuiTablePagination-toolbar': {
                    minHeight: '48px',
                    paddingLeft: 0,
                    paddingRight: 0,
                    border: 'none',
                  },
                  '& .MuiTablePagination-spacer': {
                    flex: 'none',
                  },
                  '& .MuiTablePagination-selectLabel': {
                    fontSize: '14px',
                    color: '#374151',
                  },
                  '& .MuiTablePagination-displayedRows': {
                    fontSize: '14px',
                    color: '#374151',
                    margin: '0 16px',
                  },
                }}
              />
              
              {/* Card Footer - Copyright */}
              <Divider sx={{ borderColor: '#E5E7EB', mx: -3, mt: 0 }} />
              <Box sx={{ 
                pt: '14px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Typography sx={{ 
                  fontSize: '12px', 
                  color: '#9AA0A6',
                  fontFamily: 'Roboto, sans-serif',
                  textAlign: 'center',
                }}>
                  Copyright © StaffAny Take Home Test 2025.
                </Typography>
              </Box>
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
          popper: {
            placement: 'bottom-start',
            modifiers: [
              {
                name: 'flip',
                enabled: true,
                options: {
                  altBoundary: true,
                  rootBoundary: 'viewport',
                  padding: 8,
                },
              },
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  altAxis: true,
                  altBoundary: true,
                  tether: true,
                  rootBoundary: 'viewport',
                  padding: 8,
                },
              },
            ],
            sx: {
              zIndex: 1300,
              '& .MuiPaper-root': {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              },
            },
          },
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
