import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from "discord.js";
import { DataSource } from "typeorm";
import { User } from "../models/user";
import { getCurrentDateSaoPaulo } from "../utils/dateUtils";

export const SetAuraData = {
  name: "setaura",
  description: "Define aura de um usuário",
  options: [
    {
      name: "user",
      description: "Usuário para definir aura",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "aura",
      description: "Valor de aura para definir",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
};

export const SetAuraExecute = async (
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource,
) => {
  if (!interaction.memberPermissions?.has("Administrator"))
    return await interaction.reply({
      content: "Somente um administrador pode usar esse comando!",
      ephemeral: true,
    });

  const targetUser = interaction.options.getUser("user")!;
  const auraValue = interaction.options.getInteger("aura")!;
  const userRepository = dataSource.getRepository(User);

  let user = await userRepository.findOneBy({
    discordId: targetUser.id,
  });

  if (!user) {
    user = userRepository.create({
      discordId: targetUser.id,
      aura: auraValue,
      updatedAt: getCurrentDateSaoPaulo(),
    });
  } else {
    user.aura = auraValue;
    user.updatedAt = getCurrentDateSaoPaulo();
  }

  await userRepository.save(user);

  await interaction.reply({
    content: `Aura de ${targetUser} foi definida para ${auraValue}`,
  });
};
