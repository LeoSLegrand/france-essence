import cors from "cors";
import express from "express";

import healthRouter from "./routes/health";
import stationsRouter from "./routes/stations";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/health", healthRouter);
app.use("/api/v1/stations", stationsRouter);

export default app;
