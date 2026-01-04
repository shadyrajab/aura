import { DataSource } from "typeorm";
import { Event } from "../models/event";
import { Winner } from "../models/winner";

export async function seedInitialData(AppDataSource: DataSource) {
  const eventRepository = AppDataSource.getRepository(Event);
  const winnerRepository = AppDataSource.getRepository(Winner);

  const existingEvent = await eventRepository.findOne({ where: { id: 1 } });

  if (!existingEvent) {
    const previousEvent = eventRepository.create({
      id: 1,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-12-31"),
      isActive: false,
      discordEventId: null,
    });
    await eventRepository.save(previousEvent);
    console.log("Evento anterior criado");

    const previousWinner = winnerRepository.create({
      discordId: "303733409291698196",
      finalAura: 52,
      eventId: 1,
      event: previousEvent,
    });
    await winnerRepository.save(previousWinner);
    console.log("Vencedor do evento anterior registrado");
  }

  const currentEvent = await eventRepository.findOne({ where: { isActive: true } });

  if (currentEvent && !currentEvent.discordEventId) {
    currentEvent.discordEventId = "1457167174350147584";
    await eventRepository.save(currentEvent);
    console.log("ID do Discord adicionado ao evento atual");
  }

  console.log("Migration concluída com sucesso");
}
