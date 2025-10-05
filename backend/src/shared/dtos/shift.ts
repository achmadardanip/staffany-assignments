import Joi from 'joi';

const timeRegex = /([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createShiftDto = Joi.object({
  name: Joi.string().required(),
  date: Joi.string().regex(dateRegex).required(),
  startTime: Joi.string().regex(timeRegex).required(),
  endTime: Joi.string().regex(timeRegex).required(),
  ignoreClash: Joi.boolean(),
});

export const updateShiftDto = Joi.object({
  name: Joi.string(),
  date: Joi.string().regex(dateRegex),
  startTime: Joi.string().regex(timeRegex),
  endTime: Joi.string().regex(timeRegex),
  ignoreClash: Joi.boolean(),
});

export const listShiftQueryDto = Joi.object({
  weekStartDate: Joi.string().regex(dateRegex),
});