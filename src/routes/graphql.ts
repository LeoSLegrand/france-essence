import express, { Router } from "express";
import { graphql } from "graphql";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createGraphQLContext } from "../graphql/context";
import { createGraphQLRoot } from "../graphql/resolvers";
import { graphqlSchema } from "../graphql/schema";

type GraphQLRouteDependencies = Pick<AppDependencies, "stationService" | "userService">;

export const createGraphQLRouter = (dependencies: GraphQLRouteDependencies) => {
  const router = Router();
  const rootValue = createGraphQLRoot(dependencies);

  router.use(express.json());

  router.get("/", (_req, res) => {
    return res.status(200).json({
      message: "GraphQL endpoint is available. Send POST requests to /graphql with a JSON body containing query and optional variables.",
      examples: {
        publicQuery: {
          query:
            "query($stationId:Int!,$dateFrom:String!,$dateTo:String!){ stationPriceSeries(stationId:$stationId,dateFrom:$dateFrom,dateTo:$dateTo,interval:DAY){ timestamp fuelType price samples } }",
          variables: {
            stationId: 1800000000,
            dateFrom: "2026-04-01T00:00:00.000Z",
            dateTo: "2026-04-02T00:00:00.000Z"
          }
        },
        privateQuery: {
          query:
            "query($dateFrom:String!,$dateTo:String!){ userFuelSpendSeries(dateFrom:$dateFrom,dateTo:$dateTo,interval:DAY){ timestamp fuelType totalSpend totalLiters fillUps averagePricePerLiter } }",
          headers: {
            Authorization: "Bearer <jwt>"
          },
          variables: {
            dateFrom: "2026-04-01T00:00:00.000Z",
            dateTo: "2026-04-30T23:59:59.999Z"
          }
        }
      }
    });
  });

  router.post("/", async (req, res) => {
    const { query, variables, operationName } = req.body ?? {};
    if (typeof query !== "string") {
      return res.status(400).json({
        errors: [{ message: "query must be a string" }]
      });
    }

    const result = await graphql({
      schema: graphqlSchema,
      source: query,
      rootValue,
      contextValue: createGraphQLContext(req.headers as { authorization?: string | string[] }),
      variableValues: variables,
      operationName: typeof operationName === "string" ? operationName : undefined
    });

    return res.status(200).json(result);
  });

  return router;
};

export default createGraphQLRouter({
  stationService: appDependencies.stationService,
  userService: appDependencies.userService
});
