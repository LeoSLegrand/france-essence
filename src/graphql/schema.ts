import { buildSchema } from "graphql";

export const graphqlSchema = buildSchema(`
  enum FuelType {
    SP95
    Gazole
    E85
    GPLc
    E10
    SP98
  }

  enum SeriesInterval {
    HOUR
    DAY
    WEEK
  }

  type StationPricePoint {
    timestamp: String!
    fuelType: FuelType!
    price: Float!
    samples: Int!
  }

  type UserFuelSpendPoint {
    timestamp: String!
    fuelType: FuelType!
    totalSpend: Float!
    totalLiters: Float!
    fillUps: Int!
    averagePricePerLiter: Float
  }

  type Query {
    stationPriceSeries(
      stationId: Int!
      fuelType: FuelType
      dateFrom: String!
      dateTo: String!
      interval: SeriesInterval = DAY
    ): [StationPricePoint!]!

    userFuelSpendSeries(
      dateFrom: String!
      dateTo: String!
      interval: SeriesInterval = DAY
    ): [UserFuelSpendPoint!]!
  }
`);
