import { Client, EmbedBuilder } from "discord.js";
import { DataSource } from "typeorm";
import { User } from "./models/user";
import { GuildConfig } from "./models/guildConfig";
import { Event } from "./models/event";
import { Winner } from "./models/winner";
import { AuraRankingExecute, AuraRankingData } from "./commands/topaura";
import { ClearAuraData, ClearAuraExecute } from "./commands/clearaura";
import { SetAuraData, SetAuraExecute } from "./commands/setaura";
import { WinnersData, WinnersExecute } from "./commands/winners";
import { StartData, StartExecute } from "./commands/start";
import { FinishData, FinishExecute } from "./commands/finish";
import { setupTrashTalkingCron, sendPhotoRoast } from "./services/trashTalking";
import { envs } from "./config/envs";

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

export const AppDataSource = new DataSource({
  type: "postgres",
  host: envs.POSTGRES_HOST,
  port: parseInt(envs.POSTGRES_PORT),
  username: envs.POSTGRES_USER,
  password: envs.POSTGRES_PASSWORD,
  database: envs.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User, GuildConfig, Event, Winner],
});

client.on("ready", async (client) => {
  console.log(`Bot ${client.user.username} is online`);
  client.application.commands.set([AuraRankingData, ClearAuraData, SetAuraData, WinnersData, StartData, FinishData]);
  await AppDataSource.initialize();

  setupTrashTalkingCron(client);
});

client.on("messageCreate", async (message) => {
  const { channelId, attachments } = message;
  console.log(channelId)
  if (message.author.bot) return;
  if (channelId !== envs.AURA_CHANNEL_ID) return;
  if (!attachments.size) return;

  const userRepository = AppDataSource.getRepository(User);
  const { id: userId, username } = message.author;

  const topUsers = await userRepository.find({
    order: { aura: "DESC" },
  });

  let user = topUsers.find((u) => u.discordId === userId);

  if (!user) {
    user = userRepository.create({
      aura: 0,
      discordId: userId,
      updatedAt: null,
    });
  }

  user.aura = (user.aura || 0) + 1;
  user.updatedAt = new Date();

  await userRepository.save(user);

  const updatedTopUsers = await userRepository.find({
    order: { aura: "DESC" },
  });

  const position = updatedTopUsers.findIndex((u) => u.discordId === userId);

  const roastMessage = sendPhotoRoast(client, userId);

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
        value: (position + 1).toString() + "º lugar",
        inline: true,
      },
    ])
    .setColor("#00FF00");

  await message.reply({ embeds: [embed], content: `**+1** de aura! 💪\n\n${roastMessage}` });
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "clearaura") {
      await ClearAuraExecute(interaction, AppDataSource);
    }
    if (interaction.commandName === "setaura") {
      await SetAuraExecute(interaction, AppDataSource);
    }
    if (interaction.commandName === "topaura") {
      await AuraRankingExecute(interaction, AppDataSource);
    }
    if (interaction.commandName === "winners") {
      await WinnersExecute(interaction, AppDataSource);
    }
    if (interaction.commandName === "start") {
      await StartExecute(interaction, AppDataSource);
    }
    if (interaction.commandName === "finish") {
      await FinishExecute(interaction, AppDataSource);
    }
  }
});

client.login(envs.TOKEN);
