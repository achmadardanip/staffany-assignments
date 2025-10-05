import Joi from "joi";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const weekStartParamDto = Joi.object({
  weekStartDate: Joi.string().regex(dateRegex).required(),
});
