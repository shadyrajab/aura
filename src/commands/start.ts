import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from "discord.js";
import { DataSource } from "typeorm";
import { Event } from "../models/event";
import { envs } from "../config/envs";

export const StartData = new SlashCommandBuilder()
  .setName("start")
  .setDescription("Inicia um novo evento trimestral de aura (apenas dono do servidor)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function StartExecute(
  interaction: ChatInputCommandInteraction,
  AppDataSource: DataSource
) {
  if (interaction.guild?.ownerId !== interaction.user.id) {
    await interaction.reply({
      content: "❌ Apenas o dono do servidor pode executar este comando!",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const eventRepository = AppDataSource.getRepository(Event);

    const activeEvent = await eventRepository.findOne({
      where: { isActive: true },
    });

    if (activeEvent) {
      await interaction.editReply({
        content: "❌ Já existe um evento ativo! Finalize-o primeiro com `/finish`.",
      });
      return;
    }

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
      const guild = interaction.guild!;
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

      await interaction.editReply({
        content:
          `✅ **NOVO EVENTO TRIMESTRAL INICIADO!** 🎉\n\n` +
          `📅 **Início:** ${today.toLocaleDateString("pt-BR")}\n` +
          `🏁 **Fim:** ${endDate.toLocaleDateString("pt-BR")}\n\n` +
          `O evento Discord foi criado com sucesso! 💪`
      });

      console.log(`Novo evento criado: ${today.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
      console.log(`Evento Discord criado com ID: ${scheduledEvent.id}`);
    } catch (error) {
      console.error("Erro ao criar evento Discord:", error);
      await interaction.editReply({
        content:
          `⚠️ **EVENTO INICIADO COM RESSALVAS**\n\n` +
          `📅 **Início:** ${today.toLocaleDateString("pt-BR")}\n` +
          `🏁 **Fim:** ${endDate.toLocaleDateString("pt-BR")}\n\n` +
          `O evento foi criado no banco de dados, mas houve um erro ao criar o evento no Discord.`
      });
    }
  } catch (error) {
    console.error("Erro ao iniciar evento:", error);
    await interaction.editReply({
      content: "❌ Erro ao iniciar o evento. Verifique os logs.",
    });
  }
}
