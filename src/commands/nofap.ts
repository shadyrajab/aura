import {
  SlashCommandBuilder,
  CommandInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel,
  Guild,
} from "discord.js";
import { DataSource } from "typeorm";
import { NoFap } from "../models/nofap";
import { User } from "../models/user";
import { GuildConfig } from "../models/guildConfig";

export const NoFapData = new SlashCommandBuilder()
  .setName("nofap")
  .setDescription("Gerenciar sistema No Fap")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setup")
      .setDescription("Configurar canal para No Fap")
      .addChannelOption((option) =>
        option
          .setName("canal")
          .setDescription("Canal onde serão enviados os check-ins diários")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("status")
      .setDescription("Ver seu progresso no No Fap")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("ranking")
      .setDescription("Ver ranking do No Fap")
  );


export async function NoFapExecute(
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource
) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "setup") {
    await setupNoFapSystem(interaction, dataSource);
  } else if (subcommand === "status") {
    await showUserStatus(interaction, dataSource);
  } else if (subcommand === "ranking") {
    await showRanking(interaction, dataSource);
  }
}

async function setupNoFapSystem(interaction: ChatInputCommandInteraction, dataSource: DataSource) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: "Você precisa ser administrador para usar este comando!",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("canal") as TextChannel;
  
  if (!channel || channel.type !== 0) {
    return await interaction.reply({
      content: "❌ Por favor, selecione um canal de texto válido!",
      ephemeral: true,
    });
  }

  const botMember = interaction.guild?.members.me;
  if (!botMember?.permissionsIn(channel).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])) {
    return await interaction.reply({
      content: "❌ Eu não tenho permissões para enviar mensagens neste canal!",
      ephemeral: true,
    });
  }

  const guildConfigRepository = dataSource.getRepository(GuildConfig);
  let guildConfig = await guildConfigRepository.findOne({
    where: { guildId: interaction.guild!.id },
  });

  if (!guildConfig) {
    guildConfig = guildConfigRepository.create({
      guildId: interaction.guild!.id,
      noFapChannelId: channel.id,
    });
  } else {
    guildConfig.noFapChannelId = channel.id;
  }

  await guildConfigRepository.save(guildConfig);

  await interaction.reply({
    content: `✅ Sistema No Fap configurado!\n📍 Canal: ${channel}\n⏰ Check-ins diários serão enviados às 1h da manhã`,
    ephemeral: true,
  });
}

async function showUserStatus(
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource
) {
  const noFapRepository = dataSource.getRepository(NoFap);
  const userId = interaction.user.id;

  let userProgress = await noFapRepository.findOne({
    where: { discordId: userId },
  });

  if (!userProgress) {
    return await interaction.reply({
      content: "Você ainda não participou do No Fap! Aguarde o próximo check-in diário.",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("📊 Seu Progresso - No Fap")
    .setColor(0x00ff00)
    .addFields([
      {
        name: "🔥 Streak Atual",
        value: `${userProgress.currentStreak} dias`,
        inline: true,
      },
      {
        name: "🏆 Melhor Streak",
        value: `${userProgress.bestStreak} dias`,
        inline: true,
      },
      {
        name: "📅 Último Check-in",
        value: userProgress.lastCheckIn
          ? new Date(userProgress.lastCheckIn).toLocaleDateString("pt-BR")
          : "Nunca",
        inline: true,
      },
      {
        name: "✅ Status",
        value: userProgress.isActive ? "Ativo" : "Inativo",
        inline: true,
      },
    ])
    .setFooter({
      text: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showRanking(
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource
) {
  const noFapRepository = dataSource.getRepository(NoFap);
  
  const allUsers = await noFapRepository.find({
    order: { bestStreak: "DESC", currentStreak: "DESC" },
    take: 15,
  });

  if (allUsers.length === 0) {
    return await interaction.reply({
      content: "Nenhum participante encontrado!",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🏆 Ranking No Fap")
    .setColor(0xffd700)
    .setTimestamp();

  let description = "";
  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const member = await interaction.guild?.members.fetch(user.discordId);
    
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
    const status = user.hasFailed ? "❌" : user.isActive ? "✅" : "⏸️";
    const streakInfo = user.hasFailed ? `${user.bestStreak} dias (melhor)` : `${user.currentStreak} dias`;
    
    description += `${medal} ${status} ${member?.displayName || "Usuário"} - ${streakInfo}\n`;
  }

  embed.setDescription(description);
  await interaction.reply({ embeds: [embed] });
}


function getAuraReward(streak: number): number {
  if (streak <= 3) return 0.1;
  if (streak <= 7) return 0.2;
  if (streak <= 14) return 0.3;
  if (streak <= 21) return 0.4;
  if (streak <= 30) return 0.5;
  return 0.8; 
}

function getProgressionMessage(streak: number): string {
  const current = getAuraReward(streak);
  let next = "";
  
  if (streak < 3) next = " (próximo nível: 4 dias = +0.2 aura)";
  else if (streak < 7) next = " (próximo nível: 8 dias = +0.3 aura)";
  else if (streak < 14) next = " (próximo nível: 15 dias = +0.5 aura)";
  else if (streak < 21) next = " (próximo nível: 22 dias = +0.8 aura)";
  else if (streak < 30) next = " (próximo nível: 31 dias = +1.0 aura)";
  else next = " (nível máximo!)";
  
  return `+${current} aura${next}`;
}

export function createDailyCheckInMessage() {
  const embed = new EmbedBuilder()
    .setTitle("🌅 Check-in Diário - No Fap")
    .setDescription(
      "Como foi ontem? Esta firme no No Fap?\n\n" +
      "🟢 **Safe**\n" +
      "🔴 **Vacilei** "
    )
    .setColor(0x00ff00)
    .setTimestamp()
    .setFooter({
      text: "Seja honesto consigo mesmo! 💪",
    });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("nofap_safe")
      .setLabel("Safe")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId("nofap_lost")
      .setLabel("Perdi")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("❌")
  );

  return { embeds: [embed], components: [row] };
}

export async function handleNoFapButton(
  interaction: any,
  dataSource: DataSource
) {
  const noFapRepository = dataSource.getRepository(NoFap);
  const userRepository = dataSource.getRepository(User);
  const userId = interaction.user.id;

  const today = new Date();
  const brazilOffset = -3 * 60; 
  const utcTime = today.getTime() + (today.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (brazilOffset * 60000));
  brazilTime.setHours(0, 0, 0, 0);

  let userProgress = await noFapRepository.findOne({
    where: { discordId: userId },
  });

  if (!userProgress) {
    userProgress = noFapRepository.create({
      discordId: userId,
      currentStreak: 0,
      bestStreak: 0,
      lastCheckIn: null,
      isActive: true,
      hasFailed: false,
      streakStartDate: null,
    });
  }

  if (userProgress.hasFailed) {
    return await interaction.reply({
      content: "❌ Você já falhou no No Fap e não pode mais participar.",
      ephemeral: true,
    });
  }

  if (userProgress.lastCheckIn) {
    const lastCheckInDate = new Date(userProgress.lastCheckIn);
    const lastCheckInDateString = lastCheckInDate.toISOString().split('T')[0];
    const todayDateString = brazilTime.toISOString().split('T')[0];
    
    if (lastCheckInDateString === todayDateString) {
      return await interaction.reply({
        content: "Você já fez seu check-in hoje! Volte amanhã. 😊",
        ephemeral: true,
      });
    }
  }

  let auraUser = await userRepository.findOne({
    where: { discordId: userId },
  });

  if (!auraUser) {
    auraUser = userRepository.create({
      discordId: userId,
      aura: 0,
      updatedAt: null,
      position: 0,
    });
  }

  const isSafe = interaction.customId === "nofap_safe";
  const guild = interaction.guild as Guild;

  if (isSafe) {
    userProgress.currentStreak += 1;
    userProgress.isActive = true;
    
    if (!userProgress.streakStartDate) {
      userProgress.streakStartDate = brazilTime;
    }
    
    if (userProgress.currentStreak > userProgress.bestStreak) {
      userProgress.bestStreak = userProgress.currentStreak;
    }

    const auraReward = getAuraReward(userProgress.currentStreak);
    const progressionMsg = getProgressionMessage(userProgress.currentStreak);
    
    auraUser.aura = parseFloat(((auraUser.aura || 0) + auraReward).toFixed(2));
    await userRepository.save(auraUser);

    await interaction.reply({
      content: `🎉 Parabéns! Streak atual: **${userProgress.currentStreak} dias**\n💪 **${progressionMsg}** | Total: ${auraUser.aura}`,
      ephemeral: true,
    });
  } else {
    userProgress.currentStreak = 0;
    userProgress.isActive = false;
    userProgress.hasFailed = true; 
    userProgress.streakStartDate = null;

    auraUser.aura = Math.max(0, (auraUser.aura || 0) - 15);
    await userRepository.save(auraUser);

    await interaction.reply({
      content: `😔 Você falhou no No Fap!\n❌ **-15 aura** removida! Total: ${auraUser.aura}\n🚫 **Você não poderá mais participar este mês.**`,
      ephemeral: true,
    });
  }

  userProgress.lastCheckIn = brazilTime;
  await noFapRepository.save(userProgress);
}

