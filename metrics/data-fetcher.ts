import axios from "axios";
import {
  DataSource,
  IConfig,
  JsonRpcDataSource,
  RestDataSource,
} from "../config";

import * as helpers from "../helpers";

const parseDuration = (value: string): number => {
  const matches = value.match(/(\d+)(s|m|h)?/);
  if (matches) {
    let multiplier = 1;
    switch (matches[2]) {
      case "s":
        multiplier = 1000;
        break;
      case "m":
        multiplier = 1000 * 60;
        break;
      case "h":
        multiplier = 1000 * 60 * 60;
        break;
    }
    return Math.floor(parseFloat(matches[1]) * multiplier);
  }
  throw new Error(`Invalid interval: ${value}`);
};

const state: {
  interval: NodeJS.Timer;
  data: {
    [key: string]: {
      config: DataSource;
      lastFetch: number;
      data: any;
    };
  };
  subscribers: Function[];
  helpers: any;
} = {
  interval: setInterval(() => undefined, 1000), // TODO find a valid initial value
  data: {},
  subscribers: [],
  helpers: {},
};

export const start = (config: IConfig) => {
  if (state.interval) clearInterval(state.interval);

  config.helpers?.map((helpersPath) => {
    try {
      const helpers = require(helpersPath);
      state.helpers = {
        ...state.helpers,
        ...helpers,
      };
    } catch {}
  });

  Object.keys(config.data).map((key) => {
    state.data[key] = {
      config: config.data[key],
      lastFetch: 0,
      data: undefined,
    };
  });

  state.interval = setInterval(() => {
    Object.keys(state.data).map((key) => {
      //   console.log(
      //     Date.now() - state.data[key].lastFetch,
      //     parseDuration(state.data[key].config.interval)
      //   );
      if (
        Date.now() - state.data[key].lastFetch >=
        parseDuration(state.data[key].config.interval)
      ) {
        fetchData(key, state.data[key].config).then(
          (data) => {
            // console.log(key, data);
            state.data[key].data = data;
            state.data[key].lastFetch = Date.now();
            state.subscribers.map((fn) => fn());
          },
          (error) => console.error(error)
        );
      }
    });
  }, 1000);
};

const fetchData = async (key: string, config: DataSource) => {
  console.log("Fetching datasource", key);
  // "json" | "jsonrpc" | "shell"
  switch (config.type) {
    case "json":
      const reqConf: RestDataSource = config as RestDataSource;
      return axios
        .request({
          url: reqConf.url,
          method: reqConf.method || "get",
          data: reqConf.body,
        })
        .then((data) => ({
          data: data.data,
        }));
    case "jsonrpc":
      const rpcConf: JsonRpcDataSource = config as JsonRpcDataSource;
      return axios
        .request({
          url: rpcConf.url,
          method: "post",
          data: {
            id: Math.floor(Math.random() * 1000000),
            jsonrpc: "2.0",
            method: rpcConf.method,
            params: rpcConf.params,
          },
        })
        .then((data) => ({
          data: data.data,
        }));
    case "shell":
      Promise.resolve({});
      break;
  }
  return Promise.reject(`Data source type not valid (${config.type})`);
};

export const subscribe = (cb: () => void) => {
  state.subscribers.push(cb);
  return () => {
    state.subscribers.splice(state.subscribers.indexOf(cb), 1);
  };
};

export const getDataContext = () => {
  const context: {
    $config: { [key: string]: DataSource };
    $data: { [key: string]: any };
    $helpers: any;
  } = {
    $config: {},
    $data: {},
    $helpers: {
      ...helpers,
      ...state.helpers,
    },
  };

  Object.keys(state.data).map((key) => {
    context.$config[key] = state.data[key].config;
    context.$data[key] = state.data[key].data;
  });
  return context;
};
