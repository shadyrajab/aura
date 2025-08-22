import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { DataSource } from "typeorm";
import { User } from "../models/user";

export const AuraData = {
  name: "aura",
  description: "Paga o dia de hoje e farma uma aura",
  options: [
    {
      name: "pagamento",
      description: "Foto comprovando o pagamento de cada dia nos dai hoje",
      type: ApplicationCommandOptionType.Attachment,
      required: true,
    },
  ],
};

export const AuraRankingData = {
  name: "topaura",
  description: "Ranking de aura do servidor",
};

export const AuraExecute = async (
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource,
) => {
  const userId = interaction.user.id;
  const userRepository = dataSource.getRepository(User);

  let user = await userRepository.findOneBy({ discordId: userId });

  if (!user) {
    user = userRepository.create({
      aura: 0,
      discordId: userId,
    });
  }

  const image = interaction.options.getAttachment("pagamento");

  if (!image)
    return await interaction.reply({
      content: "Imagem não reconhecida",
      ephemeral: true,
    });

  user.aura = (user.aura || 0) + 10;

  const embed = new EmbedBuilder()
    .setImage(image.url)
    .setFooter({
      text: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(`**Aura total: ${user.aura} 💪 **`)
    .setColor("#00FF00")
    .setTimestamp();

  await userRepository.save(user);
  await interaction.reply({
    embeds: [embed],
  });
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
