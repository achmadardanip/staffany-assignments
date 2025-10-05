import { addMinutes, addDays, format, parseISO, startOfWeek } from "date-fns";
import { HttpError } from "../classes/HttpError";

const MINUTES_IN_DAY = 24 * 60;

export interface ShiftInterval {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  dayOffset: number;
}

const normalizeTimeString = (time: string): string => {
  if (!time.includes(":")) {
    throw new HttpError(400, "Invalid time format");
  }

  const [hours, minutes] = time.split(":");
  const normalizedMinutes = minutes?.slice(0, 2) ?? "00";

  return `${hours.padStart(2, "0")}:${normalizedMinutes.padStart(2, "0")}`;
};

const timeToMinutes = (time: string): number => {
  const [hourStr, minuteStr] = time.split(":");
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new HttpError(400, "Invalid time value");
  }

  return hours * 60 + minutes;
};

export const calculateShiftInterval = (
  date: string,
  startTime: string,
  endTime: string
): ShiftInterval => {
  const normalizedStart = normalizeTimeString(startTime);
  const normalizedEnd = normalizeTimeString(endTime);

  const startMinutes = timeToMinutes(normalizedStart);
  const endMinutes = timeToMinutes(normalizedEnd);

  const dayOffset = endMinutes <= startMinutes ? 1 : 0;
  const duration = endMinutes - startMinutes + dayOffset * MINUTES_IN_DAY;

  if (duration <= 0) {
    throw new HttpError(400, "Shift duration must be greater than 0");
  }

  if (duration >= MINUTES_IN_DAY) {
    throw new HttpError(400, "Shift duration must be shorter than 24 hours");
  }

  const startDate = parseISO(date);
  if (Number.isNaN(startDate.getTime())) {
    throw new HttpError(400, "Invalid date value");
  }

  const startAt = addMinutes(parseISO(`${date}T00:00:00.000Z`), startMinutes);
  const endAt = addMinutes(startAt, duration);

  return {
    startAt,
    endAt,
    durationMinutes: duration,
    dayOffset,
  };
};

export const getWeekBounds = (date: string) => {
  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Invalid date value");
  }
  const start = startOfWeek(parsed, { weekStartsOn: 1 });
  const end = addDays(start, 6);

  return {
    weekStartDate: format(start, "yyyy-MM-dd"),
    weekEndDate: format(end, "yyyy-MM-dd"),
  };
};

export const formatDate = (date: Date, pattern = "yyyy-MM-dd") =>
  format(date, pattern);

export const formatTime = (date: Date, pattern = "HH:mm") =>
  format(date, pattern);
