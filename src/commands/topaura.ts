import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { DataSource } from "typeorm";
import { User } from "../models/user";

export const AuraRankingData = {
  name: "topaura",
  description: "Ranking de aura do servidor",
};

export const AuraRankingExecute = async (
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource,
) => {
  const userRepository = dataSource.getRepository(User);
  const topUsers = await userRepository.find({
    order: { aura: "DESC" },
  });

  if (topUsers.length === 0) {
    await interaction.reply({
      content: "Nenhum usuário com aura registrada ainda.",
      ephemeral: true,
    });
    return;
  }

  const rankingText = await Promise.all(
    topUsers.map(async (user, index) => {
      const discordUser = await interaction.client.users
        .fetch(user.discordId)
        .catch(() => null);
      const username = discordUser
        ? discordUser.username
        : `Usuário desconhecido (${user.discordId})`;
      return `**${index + 1}º** - ${username}: **${user.aura}** aura`;
    }),
  );

  const embed = new EmbedBuilder()
    .setTitle("Ranking de Aura do Servidor")
    .setDescription(rankingText.join("\n"))
    .setColor("#00FF00")
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: false });
};
