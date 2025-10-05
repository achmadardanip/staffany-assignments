import { Request, ResponseToolkit } from "@hapi/hapi";
import * as weekUsecase from "../../../usecases/weekUsecase";
import { errorHandler } from "../../../shared/functions/error";
import { ISuccessResponse } from "../../../shared/interfaces";
import moduleLogger from "../../../shared/functions/logger";

const logger = moduleLogger("weekController");

export const findByStartDate = async (req: Request, h: ResponseToolkit) => {
  logger.info("Find week by start date");
  try {
    const { weekStartDate } = req.params as { weekStartDate: string };
    const data = await weekUsecase.getWeekByStartDate(weekStartDate);

    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Get week successful",
      results: data,
    };

    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const publish = async (req: Request, h: ResponseToolkit) => {
  logger.info("Publish week");
  try {
    const { weekStartDate } = req.params as { weekStartDate: string };
    const data = await weekUsecase.publishWeek(weekStartDate);

    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Publish week successful",
      results: data,
    };

    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};
