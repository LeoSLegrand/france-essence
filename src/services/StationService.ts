import prisma from "../config/prisma";

export default class StationService {
  async getStationById(id: number) {
    return prisma.station.findUnique({
      where: { id },
      include: {
        city: true,
        currentPrices: true
      }
    });
  }
}
