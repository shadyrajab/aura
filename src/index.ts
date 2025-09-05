import { Client, EmbedBuilder } from "discord.js";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./models/user";
import { NoFap } from "./models/nofap";
import { GuildConfig } from "./models/guildConfig";
import { AuraRankingExecute, AuraRankingData } from "./commands/topaura";
import { ClearAuraData, ClearAuraExecute } from "./commands/clearaura";
import { SetAuraData, SetAuraExecute } from "./commands/setaura";
import { NoFapData, NoFapExecute, handleNoFapButton } from "./commands/nofap";
import { SchedulerService } from "./services/scheduler";

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
  entities: [User, NoFap, GuildConfig],
});

client.on("ready", async (client) => {
  console.log(`Bot ${client.user.username} is online`);
  client.application.commands.set([AuraRankingData, ClearAuraData, SetAuraData, NoFapData]);
  await AppDataSource.initialize();
  
  const scheduler = new SchedulerService(client, AppDataSource);
  scheduler.startDailyCheckIn();
  
  client.on("messageCreate", async (testMessage) => {
    if (testMessage.content === "!testnofap" && !testMessage.author.bot) {
      await scheduler.testSendCheckIn();
      await testMessage.reply("✅ Teste de check-in enviado!");
    }
  });
});

client.on("messageCreate", async (message) => {
  const { channelId, attachments } = message;

  if (message.author.bot) return;
  if (channelId !== "1401409124566040736") return;
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

  await message.reply({ embeds: [embed], content: "**+1** de aura! 💪" });
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
    if (interaction.commandName === "nofap") {
      await NoFapExecute(interaction, AppDataSource);
    }
  }
  
  if (interaction.isButton() && (interaction.customId === "nofap_safe" || interaction.customId === "nofap_lost")) {
    await handleNoFapButton(interaction, AppDataSource);
  }
});

client.login(process.env.TOKEN);
