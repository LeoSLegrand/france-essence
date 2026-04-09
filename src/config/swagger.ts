import swaggerJSDoc from "swagger-jsdoc";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "France Essence API",
    version: "1.0.0",
    description: "Documentation OpenAPI des endpoints publics et auth."
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  tags: [
    { name: "Health", description: "Sante de l'API" },
    { name: "Auth", description: "Authentification" },
    { name: "Cities", description: "Recherche de villes" },
    { name: "Stations", description: "Recherche et detail des stations" },
    { name: "Statistics", description: "Statistiques publiques des prix" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "validation_error" },
          message: { type: "string", example: "Parametres invalides" },
          details: { type: "object", additionalProperties: true }
        },
        required: ["error", "message"]
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" }
        },
        required: ["status"]
      },
      SignupRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "john.doe@example.com" },
          password: { type: "string", minLength: 8, example: "Password123" },
          name: { type: "string", example: "John Doe" }
        },
        required: ["email", "password"]
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "john.doe@example.com" },
          password: { type: "string", example: "Password123" }
        },
        required: ["email", "password"]
      },
      AuthResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  email: { type: "string", format: "email", example: "john.doe@example.com" }
                },
                required: ["id", "email"]
              },
              token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
            },
            required: ["user", "token"]
          }
        },
        required: ["data"]
      },
      CitySuggestion: {
        type: "object",
        properties: {
          codeInsee: { type: "string", example: "01053" },
          name: { type: "string", example: "Bourg-en-Bresse" },
          zipCode: { type: "string", example: "01000" },
          latitude: { type: "number", format: "float", example: 46.20574 },
          longitude: { type: "number", format: "float", example: 5.2258 }
        }
      },
      CitySearchResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/CitySuggestion" }
          }
        },
        required: ["data"]
      },
      FuelPrice: {
        type: "object",
        properties: {
          fuelType: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] },
          price: { type: "string", example: "1.789" },
          isAvailable: { type: "boolean", example: true }
        }
      },
      Station: {
        type: "object",
        properties: {
          id: { type: "integer", example: 12345 },
          address: { type: "string", example: "12 Rue Victor Hugo" },
          postalCode: { type: "string", example: "01000" },
          distance: { type: "number", format: "float", example: 3.42 },
          city: {
            type: "object",
            properties: {
              name: { type: "string", example: "Bourg-en-Bresse" }
            }
          },
          currentPrices: {
            type: "array",
            items: { $ref: "#/components/schemas/FuelPrice" }
          }
        }
      },
      StationListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Station" }
          }
        },
        required: ["data"]
      },
      StationDetailResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Station" }
        },
        required: ["data"]
      },
      StationHistoryEntry: {
        type: "object",
        properties: {
          recordedAt: { type: "string", format: "date-time" },
          price: { type: "string", example: "1.789" },
          isAvailable: { type: "boolean", example: true }
        }
      },
      StationHistoryResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              stationId: { type: "integer", example: 12345 },
              dateFrom: { type: "string", format: "date-time" },
              dateTo: { type: "string", format: "date-time" },
              historyByFuel: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StationHistoryEntry" }
                }
              }
            },
            required: ["stationId", "dateFrom", "dateTo", "historyByFuel"]
          }
        },
        required: ["data"]
      },
      StatisticsAverage: {
        type: "object",
        properties: {
          fuelType: { type: "string", example: "E10" },
          averagePrice: { type: "string", example: "1.768" },
          samples: { type: "integer", example: 1200 }
        },
        required: ["fuelType", "averagePrice", "samples"]
      },
      StatisticsResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              averages: {
                type: "array",
                items: { $ref: "#/components/schemas/StatisticsAverage" }
              }
            },
            required: ["averages"]
          }
        },
        required: ["data"]
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verifier l'etat de l'API",
        responses: {
          "200": {
            description: "API operationnelle",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Creer un compte utilisateur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Compte cree",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "409": {
            description: "Email deja utilise",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Se connecter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Connexion reussie",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Identifiants invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/cities/search": {
      get: {
        tags: ["Cities"],
        summary: "Rechercher des villes",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 2 },
            example: "bourg"
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 20 },
            example: 10
          }
        ],
        responses: {
          "200": {
            description: "Suggestions de villes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CitySearchResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/stations": {
      get: {
        tags: ["Stations"],
        summary: "Trouver des stations par rayon",
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", minimum: -90, maximum: 90 },
            example: 46.20574
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", minimum: -180, maximum: 180 },
            example: 5.2258
          },
          {
            name: "radius",
            in: "query",
            required: true,
            schema: { type: "number", minimum: 0.1, maximum: 200 },
            example: 10
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 500 },
            example: 100
          }
        ],
        responses: {
          "200": {
            description: "Liste des stations",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StationListResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/stations/{id}": {
      get: {
        tags: ["Stations"],
        summary: "Detail d'une station",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 12345
          }
        ],
        responses: {
          "200": {
            description: "Detail de la station",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StationDetailResponse" }
              }
            }
          },
          "404": {
            description: "Station introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/stations/{id}/prices/history": {
      get: {
        tags: ["Stations"],
        summary: "Historique des prix d'une station",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 12345
          },
          {
            name: "fuelType",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] },
            example: "E10"
          },
          {
            name: "dateFrom",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-01T00:00:00.000Z"
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-08T23:59:59.000Z"
          }
        ],
        responses: {
          "200": {
            description: "Historique groupe par carburant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StationHistoryResponse" }
              }
            }
          },
          "404": {
            description: "Station introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/statistics/prices": {
      get: {
        tags: ["Statistics"],
        summary: "Statistiques publiques des prix",
        parameters: [
          {
            name: "level",
            in: "query",
            required: true,
            schema: { type: "string", enum: ["national", "department"] },
            example: "national"
          },
          {
            name: "departmentCode",
            in: "query",
            required: false,
            schema: { type: "string", pattern: "^\\d{2}$" },
            example: "01"
          },
          {
            name: "fuelType",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] },
            example: "E10"
          },
          {
            name: "dateFrom",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-01T00:00:00.000Z"
          },
          {
            name: "dateTo",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-08T23:59:59.000Z"
          }
        ],
        responses: {
          "200": {
            description: "Moyennes par carburant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StatisticsResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: []
});
