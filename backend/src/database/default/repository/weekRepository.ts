import { FindOptionsWhere, getRepository } from "typeorm";
import Week from "../entity/week";
import moduleLogger from "../../../shared/functions/logger";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

const logger = moduleLogger("weekRepository");

export const findById = async (id: string): Promise<Week | null> => {
  logger.info("Find week by id");
  const repository = getRepository(Week);
  return repository.findOne({ where: { id } });
};

export const findOne = async (
  where: FindOptionsWhere<Week>
): Promise<Week | null> => {
  logger.info("Find week by query");
  const repository = getRepository(Week);
  return repository.findOne({ where });
};

export const create = async (payload: Partial<Week>): Promise<Week> => {
  logger.info("Create week");
  const repository = getRepository(Week);
  const week = repository.create(payload);
  return repository.save(week);
};

export const updateById = async (
  id: string,
  payload: QueryDeepPartialEntity<Week>
): Promise<Week | null> => {
  logger.info("Update week");
  const repository = getRepository(Week);
  await repository.update(id, payload);
  return findById(id);
};
