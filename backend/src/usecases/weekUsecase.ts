import { Between } from "typeorm";
import * as weekRepository from "../database/default/repository/weekRepository";
import * as shiftRepository from "../database/default/repository/shiftRepository";
import { getWeekBounds } from "../shared/functions";
import { HttpError } from "../shared/classes/HttpError";
import { dbConnection } from "../database";

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

  const connection = await dbConnection.getConnection();
  
  return await connection.transaction(async (transactionalEntityManager) => {
    const weekRepo = transactionalEntityManager.getRepository("Week");
    
    let week = await weekRepo.findOne({ where: { startDate: normalizedStart } });

    if (!week) {
      week = await weekRepo.save({
        startDate: normalizedStart,
        endDate: weekEndDate,
        isPublished: false,
        publishedAt: null,
      });
    }

    if (week.isPublished) {
      throw new HttpError(400, "Week is already published");
    }

    const shiftRepo = transactionalEntityManager.getRepository("Shift");
    const shifts = await shiftRepo.find({
      where: {
        date: Between(normalizedStart, weekEndDate),
      },
    });

    if (shifts.length === 0) {
      throw new HttpError(400, "Cannot publish an empty week");
    }

    const publishedAt = new Date();

    await weekRepo.update(week.id, {
      isPublished: true,
      publishedAt,
    });

    const updatedWeek = await weekRepo.findOne({ where: { id: week.id } });

    return mapWeekResponse({
      id: updatedWeek?.id ?? week.id,
      startDate: updatedWeek?.startDate ?? week.startDate,
      endDate: updatedWeek?.endDate ?? week.endDate,
      isPublished: true,
      publishedAt,
    });
  });
};
