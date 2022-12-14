import { IConfig, MetricValueType } from "../config";
import PromClient from "prom-client";
import * as DataFetcher from "./data-fetcher";
import { wrappedEval } from "../eval";

const register = new PromClient.Registry();

const state: {
  config: IConfig;
  metrics: {
    [key: string]: any;
  };
} = {
  config: undefined as any,
  metrics: {},
};

export const init = (config: IConfig) => {
  state.config = config;
  Object.keys(config.metrics).map((key) => {
    // "counter" | "gauge" | "histogram" | "summary"
    switch (config.metrics[key].type) {
      case "counter":
        state.metrics[key] = new PromClient.Counter({
          name: key,
          help: config.metrics[key].help || "",
          labelNames: config.metrics[key].labels,
        });
        break;
      case "gauge":
        state.metrics[key] = new PromClient.Gauge({
          name: key,
          help: config.metrics[key].help || "",
          labelNames: config.metrics[key].labels,
        });
        break;
      case "histogram":
        state.metrics[key] = new PromClient.Histogram({
          name: key,
          help: config.metrics[key].help || "",
          labelNames: config.metrics[key].labels,
          buckets: config.metrics[key].buckets,
        });
        break;
      case "summary":
        state.metrics[key] = new PromClient.Summary({
          name: key,
          help: config.metrics[key].help || "",
          labelNames: config.metrics[key].labels,
          percentiles: config.metrics[key].buckets,
        });
        break;
    }

    register.registerMetric(state.metrics[key]);
  });
};

const getLabels = (labels: any, context: any) => {
  if (!labels) return {};
  //   console.log(labels);
  if (Array.isArray(labels)) {
    return labels.map((l) => wrappedEval(l, context, !l.startsWith("$")));
  } else {
    const result: any = {};
    Object.keys(labels).map((key: string) => {
      result[key] = wrappedEval(
        labels[key],
        context,
        !labels[key].startsWith("$")
      );
    });
    return result;
  }
};

const getValues = (
  valuesConfig: MetricValueType | MetricValueType[],
  context: any
) => {
  const conf: MetricValueType[] = Array.isArray(valuesConfig)
    ? valuesConfig
    : [valuesConfig];
  const values: any[] = [];

  conf.map((valueConfig) => {
    if (valueConfig.loop) {
      const iter = wrappedEval(valueConfig.loop.on, context);
      try {
        if (typeof iter === "object") {
          Object.keys(iter).map((key) => {
            const item = iter[key];
            const loopContext = {
              ...context,
              $key: key,
              [valueConfig.loop.as || "$item"]: item,
            };
            if (
              valueConfig.loop.where &&
              !wrappedEval(valueConfig.loop.where, loopContext)
            ) {
              // ignore value
              return;
            }

            values.push(
              ...getValues(valueConfig.loop.values as any, loopContext)
            );
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        // console.log(valueConfig.labels, getLabels(valueConfig.labels, context));
        values.push([
          getLabels(valueConfig.labels, context),
          wrappedEval(valueConfig.value, context, false),
        ]);
      } catch (e) {
        //console.error(e);
      }
    }
  });

  //   console.log(values);
  return values;
};

DataFetcher.subscribe(() => {
  const context = DataFetcher.getDataContext();
  Object.keys(state.metrics).map((key) => {
    // console.log(key);
    const values = getValues(state.config.metrics[key].values, context);
    // console.log(values);
    if (state.config.metrics[key].resetOnUpdate) {
      state.metrics[key]?.reset();
    }
    values.map((v) => {
      // console.log(v);
      switch (state.config.metrics[key].type) {
        case "counter":
          state.metrics[key].inc(...v);
          break;
        case "gauge":
          state.metrics[key].set(...v);

          break;
        case "histogram":
          state.metrics[key].observe(...v);
          break;
        case "summary":
          state.metrics[key].observe(...v);
          break;
      }
    });
  });
});

export const getMetrics = async () => {
  return register.metrics();
};
