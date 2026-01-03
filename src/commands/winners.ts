import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { DataSource } from "typeorm";
import { Winner } from "../models/winner";

export const WinnersData = new SlashCommandBuilder()
  .setName("winners")
  .setDescription("Mostra a lista de vencedores dos eventos trimestrais");

export async function WinnersExecute(
  interaction: ChatInputCommandInteraction,
  AppDataSource: DataSource
) {
  const winnerRepository = AppDataSource.getRepository(Winner);

  const winners = await winnerRepository.find({
    relations: ["event"],
    order: { createdAt: "DESC" },
  });

  if (winners.length === 0) {
    await interaction.reply({
      content: "Ainda não há vencedores registrados!",
      ephemeral: true,
    });
    return;
  }

  const winnersText = await Promise.all(
    winners.map(async (winner, index) => {
      try {
        const discordUser = await interaction.client.users.fetch(winner.discordId);
        const username = discordUser.username;
        const startDate = new Date(winner.event.startDate).toLocaleDateString("pt-BR");
        const endDate = new Date(winner.event.endDate).toLocaleDateString("pt-BR");
        const trophy = index === 0 ? "🏆" : index === 1 ? "🥇" : index === 2 ? "🥈" : "🎖️";

        return `${trophy} **${username}**\n` +
               `   Período: ${startDate} - ${endDate}\n` +
               `   Aura Final: **${winner.finalAura}**\n`;
      } catch (error) {
        return `🎖️ **Usuário desconhecido**\n` +
               `   Aura Final: **${winner.finalAura}**\n`;
      }
    })
  );

  const embed = new EmbedBuilder()
    .setTitle("🏆 HALL DA FAMA - VENCEDORES 🏆")
    .setDescription(winnersText.join("\n"))
    .setColor("#FFD700")
    .setTimestamp()
    .setFooter({ text: "Eventos trimestrais de Aura" });

  await interaction.reply({ embeds: [embed] });
}
