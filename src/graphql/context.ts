import {
  resolveJwtSecretFromEnv,
  tryExtractAuthLocalsFromAuthorizationHeader
} from "../middlewares/auth";

export type GraphQLContext = {
  userId: number | null;
};

const jwtSecret = resolveJwtSecretFromEnv();

type GraphQLHeaders = {
  authorization?: string | string[];
};

const normalizeAuthorizationHeader = (headers: GraphQLHeaders) => {
  const authorization = headers.authorization;
  if (typeof authorization === "string") {
    return authorization;
  }

  if (Array.isArray(authorization) && authorization.length > 0) {
    return authorization[0];
  }

  return undefined;
};

export const createGraphQLContext = (headers: GraphQLHeaders): GraphQLContext => {
  const authorizationHeader = normalizeAuthorizationHeader(headers);
  const auth = tryExtractAuthLocalsFromAuthorizationHeader(authorizationHeader, jwtSecret);

  return {
    userId: auth?.userId ?? null
  };
};
