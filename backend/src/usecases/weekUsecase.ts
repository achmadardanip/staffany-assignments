import { Between } from "typeorm";
import * as weekRepository from "../database/default/repository/weekRepository";
import * as shiftRepository from "../database/default/repository/shiftRepository";
import { getWeekBounds } from "../shared/functions";
import { HttpError } from "../shared/classes/HttpError";

const mapWeekResponse = (week: {
  id?: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  publishedAt: Date | null;
}) => ({
  id: week.id ?? null,
  startDate: week.startDate,
  endDate: week.endDate,
  isPublished: week.isPublished,
  publishedAt: week.publishedAt,
});

export const getWeekByStartDate = async (weekStartDate: string) => {
  const { weekStartDate: normalizedStart, weekEndDate } =
    getWeekBounds(weekStartDate);

  const week = await weekRepository.findOne({ startDate: normalizedStart });

  if (!week) {
    return mapWeekResponse({
      startDate: normalizedStart,
      endDate: weekEndDate,
      isPublished: false,
      publishedAt: null,
    });
  }

  return mapWeekResponse(week);
};

export const publishWeek = async (weekStartDate: string) => {
  const { weekStartDate: normalizedStart, weekEndDate } =
    getWeekBounds(weekStartDate);

  let week = await weekRepository.findOne({ startDate: normalizedStart });

  if (!week) {
    week = await weekRepository.create({
      startDate: normalizedStart,
      endDate: weekEndDate,
      isPublished: false,
      publishedAt: null,
    });
  }

  if (week.isPublished) {
    throw new HttpError(400, "Week is already published");
  }

  const shifts = await shiftRepository.find({
    where: {
      date: Between(normalizedStart, weekEndDate),
    },
  });

  if (shifts.length === 0) {
    throw new HttpError(400, "Cannot publish an empty week");
  }

  const publishedAt = new Date();

  await weekRepository.updateById(week.id, {
    isPublished: true,
    publishedAt,
  });

  await shiftRepository.updateWhere(
    { weekId: week.id },
    {
      isPublished: true,
      publishedAt,
    }
  );

  const updatedWeek = await weekRepository.findById(week.id);

  return mapWeekResponse(updatedWeek ?? { ...week, isPublished: true, publishedAt });
};
