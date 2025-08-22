import { Client, EmbedBuilder } from "discord.js";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./models/user";
import {
  AuraExecute,
  AuraRankingExecute,
  AuraData,
  AuraRankingData,
} from "./commands/aura";

config();

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User],
});

client.on("ready", async (client) => {
  console.log(`Bot ${client.user.username} is online`);
  client.application.commands.set([AuraData, AuraRankingData]);
  await AppDataSource.initialize();
});

client.on("messageCreate", async (message) => {
  const { channelId, attachments } = message;

  if (message.author.id === "1404307068390867076") return;
  if (channelId !== "1401409124566040736") return;
  if (!attachments.size) return;
  const userRepository = AppDataSource.getRepository(User);
  const { id: userId, username } = message.author;

  const topUsers = await userRepository.find({
    order: { aura: "DESC" },
  });

  const rankedUsers = topUsers.map((u, index) => ({
    ...u,
    position: index + 1,
  }));

  let user = rankedUsers.find((rankedUser) => rankedUser.discordId === userId);

  if (!user) {
    user = userRepository.create({
      aura: 0,
      discordId: userId,
      updatedAt: null,
    });
  }

  if (
    user.updatedAt &&
    user.updatedAt.toLocaleDateString() ===
      message.createdAt.toLocaleDateString()
  )
    return await message.reply({
      content: "Tu já farmou aura hoje! Volte amanhã.",
    });

  user.aura = (user.aura || 0) + 1;
  user.updatedAt = message.createdAt;

  await userRepository.save(user);
  const embed = new EmbedBuilder()
    .setFooter({
      text: `${username}`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp()
    .setFields([
      {
        name: "**💪 Aura total:**",
        value: user.aura.toString(),
        inline: true,
      },
      {
        name: "**📅 Última farmada:**",
        value: user.updatedAt!.toLocaleDateString(),
        inline: true,
      },
      {
        name: "**🏆 Posição no Ranking:**",
        value: user.position.toString() + "º lugar",
        inline: true,
      },
    ])
    .setColor("#00FF00");

  await message.reply({ embeds: [embed], content: "**+1** de aura! 💪" });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "aura") {
    await AuraExecute(interaction, AppDataSource);
  }
  if (interaction.commandName === "topaura") {
    await AuraRankingExecute(interaction, AppDataSource);
  }
});

client.login(process.env.TOKEN);
