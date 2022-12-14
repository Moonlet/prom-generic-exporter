import * as helpers from "./helpers";
import * as fs from "fs";
import * as path from "path";

import yml from "js-yaml";
import configSchema from "./config-validation";
import * as DataFetcher from "./metrics/data-fetcher";
import * as Metrics from "./metrics/metrics";
import { IConfig } from "./config";
import express from "express";

let configPath = process.argv[2];

if (fs.existsSync(configPath)) {
  // all ok
} else if (fs.existsSync(path.resolve(process.cwd(), configPath))) {
  configPath = path.resolve(process.cwd(), configPath);
} else {
  console.error("Config file is mandatory.");
  console.log("Usage: ");
}

// console.log(configPath);

const ymlConfig: IConfig = yml.load(
  fs.readFileSync(configPath, "utf8")
) as IConfig;

const config = {
  ...ymlConfig,
  general: {
    port: 9975,
    path: "/metrics",
    ...ymlConfig.general,
  },
} as IConfig;

// console.log(config);

const validation = configSchema.validate(config);
if (validation.error) {
  validation.error.details.map((m) => console.error(m.message));
  process.exit(1);
}
console.log("Loaded config from:", configPath);

// console.log(JSON.stringify(configSchema.validate(config), null, 4));

DataFetcher.start(config);
Metrics.init(config);

const app: any = express();
app.get(`${config?.general?.path}`, async (req: any, res: any) => {
  res.setHeader("Content-Type", "text/plain");
  // res.send("Aloha!!!");
  res.send(await Metrics.getMetrics());
});
app.listen(config?.general?.port as number, () => {
  console.log(
    `Listening on port: ${config?.general?.port} path: ${config?.general?.path} ...`
  );
});
