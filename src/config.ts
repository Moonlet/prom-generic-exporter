const config = {
  dataSources: {
    restCall1: {},
  },
};

type DataType = "json" | "jsonrpc" | "shell";

interface CommonDataSource {
  type: DataType;
}

export interface RestDataSource {
  method?: "post" | "get";
  url: string;
  body?: Object;
  interval: string;
}

export interface JsonRpcDataSource {
  url: string;
  method: string;
  params?: any;
  interval: string;
}

export interface ShellDataSource {
  script: string;
  interval: string;
}

export type DataSource = CommonDataSource &
  (RestDataSource | ShellDataSource | JsonRpcDataSource);

interface IFilters {
  [key: string]: string | number | (string | number)[];
}

interface MetricValueLoop {
  on: string;
  as?: string;
  where?: string;
  values: MetricValue | MetricValue[];
}

interface MetricValue {
  labels: string[] | { [key: string]: string };
  value: string;
}

export type MetricValueType = MetricValue & { loop: MetricValueLoop };

interface Metric {
  type: "counter" | "gauge" | "histogram" | "summary";
  help?: string;
  labels?: string[];
  buckets?: number[];
  resetOnUpdate?: boolean;
  values: MetricValueType | MetricValueType[];
}

export interface IConfig {
  general?: {
    port?: number;
    path?: string;
  };
  helpers?: string[]; // a list of js files paths relative to json config file
  data: {
    [key: string]: DataSource;
  };
  metrics: {
    [basename: string]: Metric;
  };
}
