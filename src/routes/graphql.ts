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
  const graphiqlEnabled = process.env.NODE_ENV !== "production";

  const graphiqlHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GraphiQL</title>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@1.8.7/graphiql.min.css" />
    <style>
      html, body, #graphiql { height: 100%; margin: 0; width: 100%; }
      body { overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/graphiql@1.8.7/graphiql.min.js"></script>
    <script>
      const fetcher = (graphQLParams) => {
        return fetch("/graphql", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(graphQLParams),
          credentials: "same-origin"
        }).then((response) => response.json());
      };

      const defaultQuery = ` + "`" + `query StationSeries($stationId: Int!, $dateFrom: String!, $dateTo: String!) {
  stationPriceSeries(stationId: $stationId, dateFrom: $dateFrom, dateTo: $dateTo, interval: DAY) {
    timestamp
    fuelType
    price
    samples
  }
}` + "`" + `;

      const defaultVariables = JSON.stringify({
        stationId: 1800000000,
        dateFrom: "2026-04-01T00:00:00.000Z",
        dateTo: "2026-04-02T00:00:00.000Z"
      }, null, 2);

      const defaultHeaders = JSON.stringify({
        Authorization: "Bearer <jwt>"
      }, null, 2);

      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultQuery,
          defaultVariables,
          defaultHeaders,
          headerEditorEnabled: true
        }),
        document.getElementById("graphiql")
      );
    </script>
  </body>
</html>`;

  router.use(express.json());

  router.get("/", (_req, res) => {
    return res.status(200).json({
      message: "GraphQL endpoint is available. Send POST requests to /graphql with a JSON body containing query and optional variables.",
      graphiql: graphiqlEnabled
        ? "Open /graphql/ui for a browser-based IDE."
        : "GraphiQL is disabled in production.",
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

  router.get("/ui", (_req, res) => {
    if (!graphiqlEnabled) {
      return res.status(404).json({
        error: "not_found",
        message: "GraphiQL is disabled in production"
      });
    }

    return res.status(200).type("html").send(graphiqlHtml);
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
