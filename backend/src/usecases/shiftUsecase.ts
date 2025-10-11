import { Between } from "typeorm";
import * as shiftRepository from "../database/default/repository/shiftRepository";
import * as weekRepository from "../database/default/repository/weekRepository";
import Shift from "../database/default/entity/shift";
import Week from "../database/default/entity/week";
import { calculateShiftInterval, getWeekBounds } from "../shared/functions";
import { HttpError } from "../shared/classes/HttpError";
import {
  ICreateShift,
  IUpdateShift,
} from "../shared/interfaces";
import { addDays, format } from "date-fns";

interface IFindShiftParams {
  weekStartDate?: string;
}

const sanitizeTime = (time: string) =>
  time.length > 5 ? time.slice(0, 5) : time;

const mapShiftResponse = (shift: Shift) => ({
  id: shift.id,
  name: shift.name,
  date: shift.date,
  startTime: sanitizeTime(shift.startTime),
  endTime: sanitizeTime(shift.endTime),
  isPublished: shift.week?.isPublished ?? false,
  publishedAt: shift.week?.publishedAt ?? null,
  week: shift.week
    ? {
        id: shift.week.id,
        startDate: shift.week.startDate,
        endDate: shift.week.endDate,
        isPublished: shift.week.isPublished,
        publishedAt: shift.week.publishedAt,
      }
    : null,
});

const getOrCreateWeek = async (date: string): Promise<Week> => {
  const { weekStartDate, weekEndDate } = getWeekBounds(date);
  let week = await weekRepository.findOne({ startDate: weekStartDate });

  if (!week) {
    week = await weekRepository.create({
      startDate: weekStartDate,
      endDate: weekEndDate,
      isPublished: false,
      publishedAt: null,
    });
  }

  return week;
};

const findClashingShift = async (
  candidate: { date: string; startTime: string; endTime: string },
  excludeShiftId?: string
): Promise<Shift | null> => {
  const interval = calculateShiftInterval(
    candidate.date,
    candidate.startTime,
    candidate.endTime
  );

  const rangeStart = format(addDays(new Date(`${candidate.date}T00:00:00.000Z`), -1), "yyyy-MM-dd");
  const rangeEnd = format(
    addDays(new Date(`${candidate.date}T00:00:00.000Z`), 1),
    "yyyy-MM-dd"
  );

  const candidates = await shiftRepository.find({
    where: {
      date: Between(rangeStart, rangeEnd),
    },
    relations: ["week"],
  });

  return (
    candidates
      .filter((shift) => shift.id !== excludeShiftId)
      .find((shift) => {
        const existingInterval = calculateShiftInterval(
          shift.date,
          shift.startTime,
          shift.endTime
        );

        return (
          interval.startAt < existingInterval.endAt &&
          existingInterval.startAt < interval.endAt
        );
      }) || null
  );
};

export const find = async (params: IFindShiftParams) => {
  const options = {
    relations: ["week"],
    order: {
      date: "ASC" as const,
      startTime: "ASC" as const,
    },
  };

  let shifts: Shift[] = [];

  if (params?.weekStartDate) {
    const { weekStartDate, weekEndDate } = getWeekBounds(params.weekStartDate);
    shifts = await shiftRepository.find({
      ...options,
      where: {
        date: Between(weekStartDate, weekEndDate),
      },
    });
  } else {
    shifts = await shiftRepository.find(options);
  }

  return shifts.map(mapShiftResponse);
};

export const findById = async (id: string) => {
  const shift = await shiftRepository.findById(id, { relations: ["week"] });

  if (!shift) {
    throw new HttpError(404, "Shift not found");
  }

  return mapShiftResponse(shift);
};

export const create = async (payload: ICreateShift) => {
  const { ignoreClash, ...shiftPayload } = payload;

  calculateShiftInterval(
    shiftPayload.date,
    shiftPayload.startTime,
    shiftPayload.endTime
  );

  const week = await getOrCreateWeek(shiftPayload.date);

  if (week.isPublished) {
    throw new HttpError(400, "Cannot create shift in a published week");
  }

  const clash = await findClashingShift(shiftPayload);

  if (clash && !ignoreClash) {
    throw new HttpError(409, "Shift clash detected", {
      clashingShift: mapShiftResponse(clash),
    });
  }

  const shift = new Shift();
  shift.name = shiftPayload.name;
  shift.date = shiftPayload.date;
  shift.startTime = sanitizeTime(shiftPayload.startTime);
  shift.endTime = sanitizeTime(shiftPayload.endTime);
  shift.week = week;
  shift.weekId = week.id;

  const created = await shiftRepository.create(shift);
  const createdShift = await shiftRepository.findById(created.id, {
    relations: ["week"],
  });

  if (!createdShift) {
    throw new HttpError(500, "Unable to load created shift");
  }

  return mapShiftResponse(createdShift);
};

export const updateById = async (id: string, payload: IUpdateShift) => {
  const existingShift = await shiftRepository.findById(id, { relations: ["week"] });

  if (!existingShift) {
    throw new HttpError(404, "Shift not found");
  }

  if (existingShift.week?.isPublished) {
    throw new HttpError(400, "Cannot edit a published shift");
  }

  const updatedData = {
    name: payload.name ?? existingShift.name,
    date: payload.date ?? existingShift.date,
    startTime: payload.startTime ?? existingShift.startTime,
    endTime: payload.endTime ?? existingShift.endTime,
  };

  calculateShiftInterval(
    updatedData.date,
    updatedData.startTime,
    updatedData.endTime
  );

  const targetWeek = await getOrCreateWeek(updatedData.date);

  if (targetWeek.isPublished && targetWeek.id !== existingShift.weekId) {
    throw new HttpError(400, "Cannot move shift into a published week");
  }

  const clash = await findClashingShift(updatedData, id);

  if (clash && !payload.ignoreClash) {
    throw new HttpError(409, "Shift clash detected", {
      clashingShift: mapShiftResponse(clash),
    });
  }

  const updatedShift = await shiftRepository.updateById(id, {
    name: updatedData.name,
    date: updatedData.date,
    startTime: sanitizeTime(updatedData.startTime),
    endTime: sanitizeTime(updatedData.endTime),
    weekId: targetWeek.id,
  });

  if (!updatedShift) {
    throw new HttpError(500, "Unable to load updated shift");
  }

  return mapShiftResponse(updatedShift);
};

export const deleteById = async (id: string | string[]) => {
  if (Array.isArray(id)) {
    throw new HttpError(400, "Bulk delete is not supported");
  }

  const existingShift = await shiftRepository.findById(id, { relations: ["week"] });

  if (!existingShift) {
    throw new HttpError(404, "Shift not found");
  }

  if (existingShift.week?.isPublished) {
    throw new HttpError(400, "Cannot delete a published shift");
  }

  return shiftRepository.deleteById(id);
};
