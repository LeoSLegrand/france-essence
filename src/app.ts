import cors from "cors";
import express from "express";

import healthRouter from "./routes/health";
import stationsRouter from "./routes/stations";
import statisticsRouter from "./routes/statistics";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/health", healthRouter);
app.use("/api/v1/stations", stationsRouter);
app.use("/api/v1/statistics", statisticsRouter);

export default app;
