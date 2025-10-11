import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  InputAdornment,
  Divider,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { useHistory, useLocation, useParams } from "react-router-dom";
import Joi from "joi";
import { format, parseISO, setMinutes, setSeconds, startOfWeek, addHours } from "date-fns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getErrorMessage } from "../helper/error";
import {
  createShifts,
  getShiftById,
  updateShiftById,
} from "../helper/api/shift";

interface IFormInput {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface RouteParams {
  id: string;
}

const shiftSchema = Joi.object({
  name: Joi.string().required(),
  date: Joi.string().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
});

const getDefaultTimes = () => {
  const now = new Date();
  const startOfHour = setMinutes(setSeconds(now, 0), 0);
  const startTime = format(startOfHour, "HH:mm");
  const endTime = format(addHours(startOfHour, 1), "HH:mm");
  return { startTime, endTime };
};

const getDefaultDate = (weekParam?: string | null) => {
  if (weekParam) {
    // Use the first day of the selected week in yyyy-MM-dd format for HTML5 date input
    return weekParam;
  }
  // Default to current date in yyyy-MM-dd format for HTML5 date input
  const currentDate = new Date();
  return format(currentDate, "yyyy-MM-dd");
};

const ShiftForm: FunctionComponent = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const isEdit = Boolean(id);
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const weekParam = searchParams.get("week");

  const defaultDate = getDefaultDate(weekParam);
  const { startTime: defaultStart, endTime: defaultEnd } = getDefaultTimes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<IFormInput>({
    resolver: joiResolver(shiftSchema),
    defaultValues: {
      name: "",
      date: defaultDate,
      startTime: defaultStart,
      endTime: defaultEnd,
    },
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clashShift, setClashShift] = useState<any | null>(null);
  const [pendingPayload, setPendingPayload] = useState<IFormInput | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isEdit) {
        return;
      }

      try {
        const { results } = await getShiftById(id);
        setValue("name", results.name);
        setValue("date", results.date);
        setValue("startTime", results.startTime);
        setValue("endTime", results.endTime);
        setPendingPayload({
          name: results.name,
          date: results.date,
          startTime: results.startTime,
          endTime: results.endTime,
        });
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
      }
    };

    fetchData();
  }, [id, isEdit, setValue]);

  const goBack = () => {
    const date = getValues("date");
    try {
      // Date is now in yyyy-MM-dd format from HTML5 date input
      const parsedDate = parseISO(date);
      const targetWeek = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      history.push(`/shift?week=${targetWeek}`);
    } catch (error) {
      // If date parsing fails, just go back to shifts page
      history.push("/shifts");
    }
  };

  const redirectToWeek = (date: string, weekFromResponse?: string) => {
    try {
      const weekStart = weekFromResponse
        ? weekFromResponse
        : format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
      history.push(`/shift?week=${weekStart}`);
    } catch (error) {
      // If date parsing fails, just go back to shifts page
      history.push("/shifts");
    }
  };

  const submitShift = async (formData: IFormInput, ignoreClash = false) => {
    try {
      setIsSubmitting(true);
      setError("");
      
      // Date is already in yyyy-MM-dd format from HTML5 date input
      const payload = { ...formData, ignoreClash } as any;
      let response;
      if (isEdit) {
        response = await updateShiftById(id, payload);
      } else {
        response = await createShifts(payload);
      }
      const shift = response.results;
      redirectToWeek(formData.date, shift.week?.startDate);
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.data?.clashingShift) {
        setClashShift(err.response.data.data.clashingShift);
      } else {
        const message = getErrorMessage(err);
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: IFormInput) => {
    setPendingPayload(data);
    await submitShift(data);
  };

  const handleIgnoreClash = async () => {
    if (!pendingPayload) {
      setClashShift(null);
      return;
    }
    const payload = pendingPayload;
    setClashShift(null);
    await submitShift(payload, true);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      pt: '20px',
      pb: 4,
    }}>
      <Box sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        maxWidth: '960px',
        width: '100%',
        mx: 'auto',
        p: '24px',
        position: 'relative',
        alignSelf: 'flex-start',
      }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Back Button */}
          <Button
            onClick={goBack}
            sx={{
              backgroundColor: '#D9534F',
              color: '#FFFFFF',
              fontWeight: '500',
              fontFamily: 'Roboto, sans-serif',
              fontSize: '14px',
              height: '38px',
              px: '18px',
              borderRadius: '5px',
              textTransform: 'none',
              mb: '16px',
              alignSelf: 'flex-start',
              '&:hover': {
                backgroundColor: '#C9302C',
              },
              '&:focus': {
                backgroundColor: '#C9302C',
              },
            }}
          >
            BACK
          </Button>

          {/* Form Content */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            pb: '60px',
          }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Shift Name Field */}
            <Box sx={{ width: '100%' }}>
              <Typography sx={{
                fontSize: '12px',
                color: '#6B6B6B',
                mb: '4px',
                fontFamily: 'Roboto, sans-serif',
              }}>
                Shift Name*
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter shift name"
                variant="standard"
                inputProps={{ ...register("name") }}
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#CCC',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#22B8B1',
                    borderBottomWidth: '1px',
                  },
                  '& .MuiInputBase-input': {
                    color: '#2E2E2E',
                    fontSize: '14px',
                    fontFamily: 'Roboto, sans-serif',
                  },
                }}
              />
            </Box>

            {/* Three Column Grid Layout */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '24px',
              width: '100%',
            }}>
              {/* Event Date */}
              <Box>
                <Typography sx={{
                  fontSize: '12px',
                  color: '#6B6B6B',
                  mb: '4px',
                  fontFamily: 'Roboto, sans-serif',
                }}>
                  Event date
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  variant="standard"
                  inputProps={{ 
                    ...register("date"),
                    style: { paddingLeft: '36px' }
                  }}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon sx={{ 
                          color: '#666', 
                          fontSize: '18px',
                          mr: 1,
                        }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#CCC',
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#22B8B1',
                      borderBottomWidth: '1px',
                    },
                    '& .MuiInputBase-input': {
                      color: '#2E2E2E',
                      fontSize: '14px',
                      fontFamily: 'Roboto, sans-serif',
                    },
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      opacity: 0,
                      position: 'absolute',
                      right: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                    },
                  }}
                />
              </Box>

              {/* Start Time */}
              <Box>
                <Typography sx={{
                  fontSize: '12px',
                  color: '#6B6B6B',
                  mb: '4px',
                  fontFamily: 'Roboto, sans-serif',
                }}>
                  Start Time
                </Typography>
                <TextField
                  fullWidth
                  type="time"
                  variant="standard"
                  inputProps={{ ...register("startTime") }}
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#CCC',
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#22B8B1',
                      borderBottomWidth: '1px',
                    },
                    '& .MuiInputBase-input': {
                      color: '#2E2E2E',
                      fontSize: '14px',
                      fontFamily: 'Roboto, sans-serif',
                    },
                  }}
                />
              </Box>

              {/* End Time */}
              <Box>
                <Typography sx={{
                  fontSize: '12px',
                  color: '#6B6B6B',
                  mb: '4px',
                  fontFamily: 'Roboto, sans-serif',
                }}>
                  End Time
                </Typography>
                <TextField
                  fullWidth
                  type="time"
                  variant="standard"
                  inputProps={{ ...register("endTime") }}
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#CCC',
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#22B8B1',
                      borderBottomWidth: '1px',
                    },
                    '& .MuiInputBase-input': {
                      color: '#2E2E2E',
                      fontSize: '14px',
                      fontFamily: 'Roboto, sans-serif',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '24px' }}>
            <Button
              type="submit"
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#22B8B1',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                height: '36px',
                minWidth: '100px',
                borderRadius: '6px',
                border: 'none',
                '&:hover': {
                  backgroundColor: '#1DA19B',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
                '&:disabled': {
                  backgroundColor: '#9CA3AF',
                },
              }}
            >
              {isSubmitting ? 'SAVING...' : 'SAVE'}
            </Button>
          </Box>
        </form>
        
        {/* Card Footer - Copyright outside form */}
        <Divider sx={{ borderColor: '#E5E7EB', mx: -3 }} />
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
      </Box>
      {/* Clash Dialog */}
      <Dialog 
        open={!!clashShift} 
        onClose={() => setClashShift(null)}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            width: '450px',
            maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1F2937',
          textAlign: 'left',
          pb: 1,
          pt: 3,
          px: 3,
        }}>
          Shift Clash Warning
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 0 }}>
          <DialogContentText sx={{
            color: '#1F2937',
            fontSize: '14px',
            lineHeight: 1.5,
            textAlign: 'left',
            mb: 2,
          }}>
            This shift clashes with an existing shift:
          </DialogContentText>
          {clashShift && (
            <Box sx={{ my: 2 }}>
              <Typography sx={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: '#1F2937',
                mb: 1,
              }}>
                {clashShift.name}
              </Typography>
              <Typography sx={{ 
                fontSize: '14px',
                color: '#1F2937',
                mb: 0.5,
              }}>
                Date: {format(parseISO(clashShift.date), "dd.MM.yyyy")}
              </Typography>
              <Typography sx={{ 
                fontSize: '14px',
                color: '#1F2937',
                mb: 1,
              }}>
                Time: {clashShift.startTime} - {clashShift.endTime}
              </Typography>
            </Box>
          )}
          <DialogContentText sx={{
            color: '#1F2937',
            fontSize: '14px',
            lineHeight: 1.5,
            textAlign: 'left',
            mt: 2,
          }}>
            Do you want to proceed anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', gap: 1, px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={() => setClashShift(null)}
            sx={{
              backgroundColor: 'transparent',
              color: '#6B7280',
              textTransform: 'uppercase',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleIgnoreClash}
            sx={{
              backgroundColor: 'transparent',
              color: '#1F2937',
              textTransform: 'uppercase',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Ignore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftForm;
