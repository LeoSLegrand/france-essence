import "dotenv/config";

import bcrypt from "bcrypt";

import { FuelType } from "../../prisma/generated/prisma/client";
import prisma from "../config/prisma";

type SeedFillUp = {
  daysAgo: number;
  liters: number;
  kilometers: number;
};

const DEFAULT_EMAIL = process.env.SEED_TEST_EMAIL ?? "test@france-essence.local";
const DEFAULT_PASSWORD = process.env.SEED_TEST_PASSWORD ?? "Test1234!";
const DEFAULT_VEHICLE_NAME = process.env.SEED_TEST_VEHICLE_NAME ?? "Peugeot 208 Test";
const DEFAULT_FUEL: FuelType = FuelType.E10;

const fillUpTemplates: SeedFillUp[] = [
  { daysAgo: 45, liters: 38.4, kilometers: 12450 },
  { daysAgo: 34, liters: 35.1, kilometers: 12920 },
  { daysAgo: 26, liters: 32.7, kilometers: 13280 },
  { daysAgo: 18, liters: 36.9, kilometers: 13710 },
  { daysAgo: 11, liters: 34.2, kilometers: 14105 },
  { daysAgo: 4, liters: 33.5, kilometers: 14480 }
];

const toStableDate = (daysAgo: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const chooseFuelType = (preferredFuel: string): FuelType => {
  const validFuelTypes = new Set<string>(Object.values(FuelType));
  if (validFuelTypes.has(preferredFuel)) {
    return preferredFuel as FuelType;
  }

  return DEFAULT_FUEL;
};

async function run() {
  await prisma.$connect();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {
      passwordHash
    },
    create: {
      email: DEFAULT_EMAIL,
      passwordHash
    },
    select: {
      id: true,
      email: true
    }
  });

  let vehicle = await prisma.vehicle.findFirst({
    where: {
      userId: user.id,
      name: DEFAULT_VEHICLE_NAME
    },
    select: {
      id: true,
      preferredFuel: true,
      name: true
    }
  });

  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        name: DEFAULT_VEHICLE_NAME,
        preferredFuel: DEFAULT_FUEL
      },
      select: {
        id: true,
        preferredFuel: true,
        name: true
      }
    });
  }

  const stations = await prisma.station.findMany({
    select: {
      id: true
    },
    orderBy: {
      id: "asc"
    },
    take: 10
  });

  if (stations.length === 0) {
    throw new Error("No station found. Import fuel data first with npm run import:fuel.");
  }

  const fuelType = chooseFuelType(vehicle.preferredFuel);

  let createdFillUps = 0;
  let reusedFillUps = 0;

  for (let i = 0; i < fillUpTemplates.length; i += 1) {
    const template = fillUpTemplates[i];
    const station = stations[i % stations.length];
    const date = toStableDate(template.daysAgo);

    const existing = await prisma.fillUp.findFirst({
      where: {
        vehicleId: vehicle.id,
        stationId: station.id,
        kilometers: template.kilometers,
        date
      },
      select: {
        id: true
      }
    });

    if (existing) {
      reusedFillUps += 1;
      continue;
    }

    const currentPrice = await prisma.currentPrice.findUnique({
      where: {
        stationId_fuelType: {
          stationId: station.id,
          fuelType
        }
      },
      select: {
        price: true,
        isAvailable: true
      }
    });

    const unitPrice = currentPrice?.isAvailable ? Number(currentPrice.price) : 1.79;
    const totalPrice = Number((unitPrice * template.liters).toFixed(2));

    await prisma.fillUp.create({
      data: {
        vehicleId: vehicle.id,
        stationId: station.id,
        fuelType,
        kilometers: template.kilometers,
        liters: template.liters,
        totalPrice,
        date
      }
    });

    createdFillUps += 1;
  }

  const totalFillUps = await prisma.fillUp.count({
    where: {
      vehicleId: vehicle.id
    }
  });

  console.log("Seed complete.");
  console.log(`User: ${user.email}`);
  console.log(`Password: ${DEFAULT_PASSWORD}`);
  console.log(`Vehicle: ${vehicle.name} (id=${vehicle.id})`);
  console.log(`Fill-ups created: ${createdFillUps}`);
  console.log(`Fill-ups reused: ${reusedFillUps}`);
  console.log(`Total fill-ups for vehicle: ${totalFillUps}`);
}

run()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
