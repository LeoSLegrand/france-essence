import swaggerJSDoc from "swagger-jsdoc";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "France Essence API",
    version: "1.0.0",
    description: "Documentation OpenAPI des endpoints publics, auth et prives utilisateur."
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
    { name: "Statistics", description: "Statistiques publiques des prix" },
    { name: "Users", description: "Endpoints prives utilisateur" },
    { name: "Vehicles", description: "Gestion des vehicules utilisateur" },
    { name: "FillUps", description: "Historique des pleins utilisateur" }
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
      UnauthorizedResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "unauthorized" },
          message: { type: "string", example: "Invalid or expired token" }
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
      },
      VehicleSummary: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Peugeot 208 Test" },
          preferredFuel: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] },
          _count: {
            type: "object",
            properties: {
              fillUps: { type: "integer", example: 6 }
            },
            required: ["fillUps"]
          }
        },
        required: ["id", "name", "preferredFuel"]
      },
      VehicleListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/VehicleSummary" }
          }
        },
        required: ["data"]
      },
      VehicleCreateRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Peugeot 208 Test" },
          preferredFuel: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"], example: "E10" }
        },
        required: ["name", "preferredFuel"]
      },
      VehicleUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Peugeot 208 Daily" },
          preferredFuel: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"], example: "SP95" }
        }
      },
      VehicleWriteResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              userId: { type: "integer", example: 1 },
              name: { type: "string", example: "Peugeot 208 Test" },
              preferredFuel: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] }
            },
            required: ["id", "userId", "name", "preferredFuel"]
          }
        },
        required: ["data"]
      },
      FillUpStationRef: {
        type: "object",
        properties: {
          id: { type: "integer", example: 100001 },
          address: { type: "string", example: "12 Rue Victor Hugo" },
          postalCode: { type: "string", example: "01000" },
          city: {
            type: "object",
            properties: {
              name: { type: "string", example: "Bourg-en-Bresse" }
            }
          }
        }
      },
      FillUpItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 42 },
          vehicleId: { type: "integer", example: 1 },
          stationId: { type: "integer", example: 100001 },
          fuelType: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"], example: "E10" },
          kilometers: { type: "integer", example: 14500 },
          liters: { type: "string", example: "36.400" },
          totalPrice: { type: "string", example: "65.17" },
          date: { type: "string", format: "date-time" },
          station: { $ref: "#/components/schemas/FillUpStationRef" }
        },
        required: ["id", "vehicleId", "stationId", "fuelType", "kilometers", "liters", "totalPrice", "date"]
      },
      FillUpListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FillUpItem" }
          }
        },
        required: ["data"]
      },
      FillUpCreateRequest: {
        type: "object",
        properties: {
          stationId: { type: "integer", minimum: 1, example: 100001 },
          fuelType: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"], example: "E10" },
          kilometers: { type: "integer", minimum: 0, example: 14920 },
          liters: { type: "number", minimum: 0.001, example: 34.2 },
          totalPrice: { type: "number", minimum: 0.01, example: 63.45 },
          date: { type: "string", format: "date-time", example: "2026-04-27T12:00:00.000Z" }
        },
        required: ["stationId", "fuelType", "kilometers", "liters"]
      },
      FillUpCreateResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/FillUpItem" },
          meta: {
            type: "object",
            properties: {
              pricingMode: { type: "string", enum: ["auto", "manual"], example: "auto" }
            },
            required: ["pricingMode"]
          }
        },
        required: ["data", "meta"]
      },
      MyProfileResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              email: { type: "string", format: "email", example: "test@france-essence.local" },
              vehiclesCount: { type: "integer", example: 1 },
              fillUpsCount: { type: "integer", example: 6 }
            },
            required: ["id", "email", "vehiclesCount", "fillUpsCount"]
          }
        },
        required: ["data"]
      },
      UserStatsResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              period: {
                type: "object",
                properties: {
                  dateFrom: { type: "string", format: "date-time", nullable: true },
                  dateTo: { type: "string", format: "date-time", nullable: true }
                },
                required: ["dateFrom", "dateTo"]
              },
              totals: {
                type: "object",
                properties: {
                  fillUps: { type: "integer", example: 6 },
                  totalLiters: { type: "number", example: 210.8 },
                  totalSpend: { type: "number", example: 379.52 },
                  averagePricePerLiter: { type: "number", nullable: true, example: 1.801 },
                  averageConsumptionLPer100Km: { type: "number", nullable: true, example: 7.13 }
                },
                required: ["fillUps", "totalLiters", "totalSpend", "averagePricePerLiter", "averageConsumptionLPer100Km"]
              },
              byFuel: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fuelType: { type: "string", enum: ["Gazole", "SP95", "E10", "SP98", "E85", "GPLc"] },
                    fillUps: { type: "integer" },
                    totalLiters: { type: "number" },
                    totalSpend: { type: "number" },
                    averagePricePerLiter: { type: "number", nullable: true }
                  },
                  required: ["fuelType", "fillUps", "totalLiters", "totalSpend", "averagePricePerLiter"]
                }
              },
              byVehicle: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    vehicleId: { type: "integer" },
                    vehicleName: { type: "string" },
                    fillUps: { type: "integer" },
                    totalLiters: { type: "number" },
                    totalSpend: { type: "number" },
                    averagePricePerLiter: { type: "number", nullable: true }
                  },
                  required: ["vehicleId", "vehicleName", "fillUps", "totalLiters", "totalSpend", "averagePricePerLiter"]
                }
              }
            },
            required: ["period", "totals", "byFuel", "byVehicle"]
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
    },
    "/api/v1/users/me": {
      get: {
        tags: ["Users"],
        summary: "Recuperer le profil du user connecte",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Profil utilisateur",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MyProfileResponse" }
              }
            }
          },
          "401": {
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/users/me/stats": {
      get: {
        tags: ["Users"],
        summary: "Recuperer les statistiques personnelles",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "dateFrom",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-03-01T00:00:00.000Z"
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-27T23:59:59.000Z"
          }
        ],
        responses: {
          "200": {
            description: "Statistiques personnelles",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserStatsResponse" }
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
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/vehicles": {
      get: {
        tags: ["Vehicles"],
        summary: "Lister les vehicules du user connecte",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Liste des vehicules",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VehicleListResponse" }
              }
            }
          },
          "401": {
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Vehicles"],
        summary: "Creer un vehicule",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Vehicule cree",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VehicleWriteResponse" }
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
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/vehicles/{id}": {
      get: {
        tags: ["Vehicles"],
        summary: "Detail d'un vehicule du user connecte",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 1
          }
        ],
        responses: {
          "200": {
            description: "Detail du vehicule",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { type: "object", additionalProperties: true } }, required: ["data"] }
              }
            }
          },
          "401": {
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          },
          "404": {
            description: "Vehicule introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      patch: {
        tags: ["Vehicles"],
        summary: "Mettre a jour un vehicule",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 1
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleUpdateRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Vehicule mis a jour",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VehicleWriteResponse" }
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
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          },
          "404": {
            description: "Vehicule introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Vehicles"],
        summary: "Supprimer un vehicule",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 1
          }
        ],
        responses: {
          "204": {
            description: "Vehicule supprime"
          },
          "401": {
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          },
          "404": {
            description: "Vehicule introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/vehicles/{vehicleId}/fill-ups": {
      get: {
        tags: ["FillUps"],
        summary: "Lister les pleins d'un vehicule",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "vehicleId",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 1
          },
          {
            name: "dateFrom",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-03-01T00:00:00.000Z"
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            example: "2026-04-27T23:59:59.000Z"
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
            description: "Historique des pleins",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FillUpListResponse" }
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
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          },
          "404": {
            description: "Vehicule introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["FillUps"],
        summary: "Ajouter un plein",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "vehicleId",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            example: 1
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FillUpCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Plein cree",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FillUpCreateResponse" }
              }
            }
          },
          "400": {
            description: "Validation echouee ou totalPrice requis",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Token invalide ou absent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnauthorizedResponse" }
              }
            }
          },
          "404": {
            description: "Vehicule ou station introuvable",
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
