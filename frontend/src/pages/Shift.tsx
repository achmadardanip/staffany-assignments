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
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  TablePagination,
  Typography,
} from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";
import { format, parseISO, addWeeks, startOfWeek } from "date-fns";
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
import WeekNavigator from "../components/shift/WeekNavigator";
import WeekActions from "../components/shift/WeekActions";
import ShiftTable from "../components/shift/ShiftTable";

const Shift: FunctionComponent = () => {
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
              <WeekNavigator
                weekRangeLabel={weekRangeLabel}
                isWeekPublished={isWeekPublished}
                onPrevWeek={() => handleWeekNavigation(-1)}
                onNextWeek={() => handleWeekNavigation(1)}
                onOpenCalendar={() => setIsDatePickerOpen(true)}
              />
              <WeekActions
                isWeekPublished={isWeekPublished}
                publishedAt={weekInfo?.publishedAt ?? null}
                shiftsCount={shifts.length}
                publishing={publishing}
                onAddShift={handleAddShift}
                onPublish={openPublishDialog}
              />
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
              <ShiftTable
                shifts={paginatedShifts}
                isWeekPublished={isWeekPublished}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteClick}
              />
              
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
