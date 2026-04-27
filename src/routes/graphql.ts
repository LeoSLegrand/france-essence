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
