import { Client, TextChannel } from "discord.js";
import { DataSource } from "typeorm";
import { createDailyCheckInMessage } from "../commands/nofap";
import { GuildConfig } from "../models/guildConfig";

export class SchedulerService {
  private client: Client;
  private dataSource: DataSource;
  private dailyCheckInterval: NodeJS.Timeout | null = null;

  constructor(client: Client, dataSource: DataSource) {
    this.client = client;
    this.dataSource = dataSource;
  }

  startDailyCheckIn() {
    const now = new Date();
    const next1AM = new Date();
    next1AM.setHours(1, 0, 0, 0);
    
    if (now.getHours() >= 1) {
      next1AM.setDate(next1AM.getDate() + 1);
    }

    const timeUntilNext1AM = next1AM.getTime() - now.getTime();

    console.log(`⏰ Próximo check-in No Fap agendado para: ${next1AM.toLocaleString('pt-BR')}`);

    setTimeout(() => {
      this.sendDailyCheckIn();
      this.dailyCheckInterval = setInterval(() => {
        this.sendDailyCheckIn();
      }, 24 * 60 * 60 * 1000);
      
    }, timeUntilNext1AM);
  }

  private async sendDailyCheckIn() {
    try {
      const guildConfigRepository = this.dataSource.getRepository(GuildConfig);
      
      for (const guild of this.client.guilds.cache.values()) {
        const guildConfig = await guildConfigRepository.findOne({
          where: { guildId: guild.id },
        });

        if (guildConfig && guildConfig.noFapChannelId) {
          const noFapChannel = guild.channels.cache.get(guildConfig.noFapChannelId) as TextChannel;
          
          if (noFapChannel) {
            const message = createDailyCheckInMessage();
            await noFapChannel.send(message);
            console.log(`✅ Check-in diário enviado para ${guild.name}`);
          } else {
            console.log(`⚠️ Canal No Fap não encontrado para ${guild.name}`);
          }
        } else {
          console.log(`⚠️ Configuração No Fap não encontrada para ${guild.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar check-in diário:', error);
    }
  }

  stopDailyCheckIn() {
    if (this.dailyCheckInterval) {
      clearInterval(this.dailyCheckInterval);
      this.dailyCheckInterval = null;
      console.log('⏹️ Check-in diário parado');
    }
  }

  async testSendCheckIn() {
    console.log('🧪 Enviando check-in de teste...');
    await this.sendDailyCheckIn();
  }
}
