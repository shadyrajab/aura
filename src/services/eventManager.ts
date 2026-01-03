import { Client, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from "discord.js";
import { AppDataSource } from "..";
import { Event } from "../models/event";
import { envs } from "../config/envs";

const GUILD_ID = envs.GUILD_ID;

export async function initializeCurrentEvent(client: Client) {
  try {
    const eventRepository = AppDataSource.getRepository(Event);

    const activeEvent = await eventRepository.findOne({
      where: { isActive: true },
    });

    if (!activeEvent) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);

      const newEvent = eventRepository.create({
        startDate: today,
        endDate: endDate,
        isActive: true,
      });

      await eventRepository.save(newEvent);

      try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const scheduledEvent = await guild.scheduledEvents.create({
          name: "🏆 Evento Trimestral de Aura",
          description: `Evento de competição de aura! Poste suas fotos de treino e ganhe pontos. O vencedor será anunciado em ${endDate.toLocaleDateString("pt-BR")}!`,
          scheduledStartTime: today,
          scheduledEndTime: endDate,
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: GuildScheduledEventEntityType.External,
          entityMetadata: {
            location: "Academia/Treino"
          }
        });

        newEvent.discordEventId = scheduledEvent.id;
        await eventRepository.save(newEvent);

        console.log(`Evento atual criado: ${today.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`);
        console.log(`Evento Discord criado com ID: ${scheduledEvent.id}`);
      } catch (error) {
        console.error("Erro ao criar evento Discord:", error);
        console.log("Evento criado no banco mas sem evento Discord");
      }
    }
  } catch (error) {
    console.error("Erro ao inicializar evento:", error);
  }
}
