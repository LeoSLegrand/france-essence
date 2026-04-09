import cors from "cors";
import express from "express";

import authRouter from "./routes/auth";
import citiesRouter from "./routes/cities";
import healthRouter from "./routes/health";
import stationsRouter from "./routes/stations";
import statisticsRouter from "./routes/statistics";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/cities", citiesRouter);
app.use("/api/v1/stations", stationsRouter);
app.use("/api/v1/statistics", statisticsRouter);

export default app;
