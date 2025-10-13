import { addMinutes, addDays, format, parseISO, startOfWeek, parse, isValid } from "date-fns";
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

  // Handle both HH:mm and HH:mm:ss formats
  let parsed: Date;
  if (time.length === 5) {
    // HH:mm format
    parsed = parse(time, "HH:mm", new Date());
  } else if (time.length === 8) {
    // HH:mm:ss format
    parsed = parse(time, "HH:mm:ss", new Date());
  } else {
    throw new HttpError(400, "Invalid time format");
  }

  if (!isValid(parsed)) {
    throw new HttpError(400, "Invalid time value");
  }

  return format(parsed, "HH:mm");
};

const timeToMinutes = (time: string): number => {
  // Handle both HH:mm and HH:mm:ss formats
  let parsed: Date;
  if (time.length === 5) {
    // HH:mm format
    parsed = parse(time, "HH:mm", new Date());
  } else if (time.length === 8) {
    // HH:mm:ss format
    parsed = parse(time, "HH:mm:ss", new Date());
  } else {
    throw new HttpError(400, "Invalid time format");
  }
  
  if (!isValid(parsed)) {
    throw new HttpError(400, "Invalid time value");
  }

  return parsed.getHours() * 60 + parsed.getMinutes();
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

  // Use date-fns to parse and validate the date
  const baseDate = parseISO(date);
  if (!isValid(baseDate)) {
    throw new HttpError(400, "Invalid date value");
  }

  // Construct start datetime using date-fns
  const startAt = parse(`${date} ${normalizedStart}`, "yyyy-MM-dd HH:mm", new Date());
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
  if (!isValid(parsed)) {
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
