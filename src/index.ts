import { Client, EmbedBuilder } from "discord.js";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./models/user";
import { AuraRankingExecute, AuraRankingData } from "./commands/topaura";
import { ClearAuraData, ClearAuraExecute } from "./commands/clearaura";

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
  client.application.commands.set([AuraRankingData, ClearAuraData]);
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

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  if (user.updatedAt) {
    const last = new Date(user.updatedAt).getTime();
    const elapsed = Date.now() - last;

    if (elapsed < TWELVE_HOURS_MS) {
      const remaining = TWELVE_HOURS_MS - elapsed;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.ceil((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return await message.reply({
        content: `Tu já farmou aura há pouco tempo! Tenta de novo em ${hours}h ${minutes}min.`,
      });
    }
  }

  user.aura = (user.aura || 0) + 1;
  user.updatedAt = new Date();

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
        value: (user.position + 1).toString() + "º lugar",
        inline: true,
      },
    ])
    .setColor("#00FF00");

  await message.reply({ embeds: [embed], content: "**+1** de aura! 💪" });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "clearaura") {
    await ClearAuraExecute(interaction, AppDataSource);
  }
  if (interaction.commandName === "topaura") {
    await AuraRankingExecute(interaction, AppDataSource);
  }
});

client.login(process.env.TOKEN);
