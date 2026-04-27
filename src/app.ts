import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth";
import citiesRouter from "./routes/cities";
import { swaggerSpec } from "./config/swagger";
import healthRouter from "./routes/health";
import graphqlRouter from "./routes/graphql";
import stationsRouter from "./routes/stations";
import statisticsRouter from "./routes/statistics";
import usersRouter from "./routes/users";
import vehiclesRouter from "./routes/vehicles";

const app = express();

app.use(cors());
app.use("/graphql", graphqlRouter);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/cities", citiesRouter);
app.use("/api/v1/stations", stationsRouter);
app.use("/api/v1/statistics", statisticsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/vehicles", vehiclesRouter);
app.get("/docs.json", (_req, res) => {
	res.status(200).json(swaggerSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
	explorer: true
}));

export default app;
