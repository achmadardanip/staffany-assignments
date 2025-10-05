import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { useHistory, useLocation, useParams } from "react-router-dom";
import Joi from "joi";
import { format, parseISO, setMinutes, setSeconds, startOfWeek, addHours } from "date-fns";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { getErrorMessage } from "../helper/error";
import {
  createShifts,
  getShiftById,
  updateShiftById,
} from "../helper/api/shift";
import { useTheme } from "@mui/material/styles";

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

const ShiftForm: FunctionComponent = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const isEdit = Boolean(id);
  const location = useLocation();
  const theme = useTheme();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const weekParam = searchParams.get("week");

  const defaultWeekStart = useMemo(() => {
    if (weekParam) {
      return weekParam;
    }
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  }, [weekParam]);

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
      date: defaultWeekStart,
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
    const targetWeek = format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    history.push(`/shift?week=${targetWeek}`);
  };

  const redirectToWeek = (date: string, weekFromResponse?: string) => {
    const weekStart = weekFromResponse
      ? weekFromResponse
      : format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    history.push(`/shift?week=${weekStart}`);
  };

  const submitShift = async (formData: IFormInput, ignoreClash = false) => {
    try {
      setIsSubmitting(true);
      setError("");
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
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 3,
                py: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.customColors.navy,
                color: "white",
              }}
            >
              <Button
                variant="text"
                onClick={goBack}
                startIcon={<ChevronLeftIcon sx={{ color: "white" }} />}
                sx={{
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Back
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Shift
              </Typography>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  backgroundColor: theme.customColors.turquoise,
                  color: "white",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: theme.customColors.turquoise,
                  },
                }}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </Box>
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Shift Name"
                    inputProps={{ ...register("name") }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    inputProps={{ ...register("date") }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    inputProps={{ ...register("startTime") }}
                    error={!!errors.startTime}
                    helperText={errors.startTime?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    inputProps={{ ...register("endTime") }}
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </form>
      </Grid>
      <Dialog open={!!clashShift} onClose={() => setClashShift(null)}>
        <DialogTitle>Shift Clash Warning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This shift clashes with an existing shift.
          </DialogContentText>
          {clashShift && (
            <Box mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {clashShift.name}
              </Typography>
              <Typography variant="body2">Date: {format(parseISO(clashShift.date), "yyyy-MM-dd")}</Typography>
              <Typography variant="body2">
                Time: {clashShift.startTime} - {clashShift.endTime}
              </Typography>
            </Box>
          )}
          <DialogContentText sx={{ mt: 2 }}>
            Do you want to proceed anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClashShift(null)}>Cancel</Button>
          <Button onClick={handleIgnoreClash} variant="contained">
            Ignore
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ShiftForm;
