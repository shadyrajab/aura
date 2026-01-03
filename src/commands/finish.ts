import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import { DataSource } from "typeorm";
import { Event } from "../models/event";
import { Winner } from "../models/winner";
import { User } from "../models/user";
import { envs } from "../config/envs";

export const FinishData = new SlashCommandBuilder()
  .setName("finish")
  .setDescription("Finaliza o evento trimestral atual (apenas dono do servidor)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function FinishExecute(
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
    const winnerRepository = AppDataSource.getRepository(Winner);
    const userRepository = AppDataSource.getRepository(User);

    const activeEvent = await eventRepository.findOne({
      where: { isActive: true },
    });

    if (!activeEvent) {
      await interaction.editReply({
        content: "❌ Não há nenhum evento ativo para finalizar!",
      });
      return;
    }

    const topUsers = await userRepository.find({
      order: { aura: "DESC" },
      take: 1,
    });

    if (topUsers.length === 0) {
      await interaction.editReply({
        content: "❌ Nenhum usuário participou do evento!",
      });
      return;
    }

    const winnerUser = topUsers[0];

    const winner = winnerRepository.create({
      discordId: winnerUser.discordId,
      finalAura: winnerUser.aura,
      eventId: activeEvent.id,
      event: activeEvent,
    });

    await winnerRepository.save(winner);

    const channel = await interaction.client.channels.fetch(envs.AURA_CHANNEL_ID);
    if (channel && channel instanceof TextChannel) {
      const discordUser = await interaction.client.users.fetch(winnerUser.discordId);
      await channel.send(
        `🏆🎉 **EVENTO TRIMESTRAL FINALIZADO!** 🎉🏆\n\n` +
        `Parabéns <@${winnerUser.discordId}> (${discordUser.username})!\n` +
        `Você venceu o evento com **${winnerUser.aura}** de aura!\n\n` +
        `Os pontos foram resetados! 💪`
      );
    }

    activeEvent.isActive = false;
    await eventRepository.save(activeEvent);

    if (activeEvent.discordEventId) {
      try {
        const guild = interaction.guild!;
        const scheduledEvent = await guild.scheduledEvents.fetch(activeEvent.discordEventId);
        if (scheduledEvent) {
          await scheduledEvent.delete();
          console.log("Evento Discord finalizado");
        }
      } catch (error) {
        console.error("Erro ao deletar evento Discord:", error);
      }
    }

    const allUsers = await userRepository.find();
    for (const user of allUsers) {
      user.aura = 0;
      await userRepository.save(user);
    }

    await interaction.editReply({
      content:
        `✅ **EVENTO FINALIZADO COM SUCESSO!** 🎉\n\n` +
        `🏆 **Vencedor:** <@${winnerUser.discordId}>\n` +
        `💪 **Aura Final:** ${winnerUser.aura}\n\n` +
        `Todos os pontos foram resetados!\n` +
        `Use \`/start\` para iniciar um novo evento.`
    });

    console.log(`Vencedor registrado: ${winnerUser.discordId} com ${winnerUser.aura} aura`);
  } catch (error) {
    console.error("Erro ao finalizar evento:", error);
    await interaction.editReply({
      content: "❌ Erro ao finalizar o evento. Verifique os logs.",
    });
  }
}
