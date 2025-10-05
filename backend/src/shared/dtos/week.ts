import Joi from "joi";

export const weekStartParamDto = Joi.object({
  weekStartDate: Joi.date().required(),
});
