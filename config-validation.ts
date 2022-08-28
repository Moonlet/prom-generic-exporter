import Joi from "joi";

const dataSchema = Joi.object().pattern(
  Joi.string().pattern(/^[a-z][a-z0-9]*$/i),
  Joi.object({
    type: ["json", "jsonrpc", "shell"],
    interval: Joi.string().required(),
  })
    .when(Joi.object({ type: "json" }).unknown(), {
      then: Joi.object({
        method: Joi.string()
          .optional()
          .pattern(/post|get/i),
        url: Joi.string().uri().required(),
        body: Joi.any().optional(),
      }),
    })
    .when(Joi.object({ type: "jsonrpc" }).unknown(), {
      then: Joi.object({
        url: Joi.string().uri().required(),
        method: Joi.string().required(),
        params: Joi.alternatives(Joi.object(), Joi.array()).optional(),
      }),
    })
    .when(Joi.object({ type: "shell" }).unknown(), {
      then: Joi.object({
        script: Joi.string().required(),
      }),
    })
);

const getMetricValueSchema = (withLoop: boolean) =>
  Joi.object({
    labels: Joi.alternatives(
      Joi.array().items(Joi.string()),
      Joi.object().pattern(Joi.string(), Joi.string())
    ).required(),
    value: withLoop ? Joi.string() : Joi.string().required(),
  });

const metricValueTypeSchema = getMetricValueSchema(true)
  .append({
    loop: Joi.object({
      on: Joi.string().required(),
      as: Joi.string().optional(),
      values: getMetricValueSchema(false),
    }),
  })
  .or("loop", "value");

const metricsSchema = Joi.object({
  type: Joi.string()
    .required()
    .pattern(/counter|gauge|histogram|summary/i),
  help: Joi.string().optional(),
  labels: Joi.array()
    .items(Joi.string().pattern(/^[a-z][a-z0-9_]*$/i))
    .optional(),
  buckets: Joi.array().optional().items(Joi.number()),
  values: Joi.alternatives(
    metricValueTypeSchema,
    Joi.array().items(metricValueTypeSchema)
  ).required(),
});

export default Joi.object({
  helpers: Joi.array().optional().items(Joi.string()),
  data: dataSchema,
  metrics: Joi.object().pattern(/^[a-z][a-z0-9_]*/i, metricsSchema),
});
