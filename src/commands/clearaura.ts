import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { DataSource } from "typeorm";
import { User } from "../models/user";

export const ClearAuraData = {
   name: "clearaura",
   description: "Remove aura de um usuário",
   options: [
     {
      name: "user",
      description: "Usuário para remover aura",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
        name: "aura",
        description: "Aura para remover",
        type: ApplicationCommandOptionType.Integer,
        required: true
    }
   ]
}

export const ClearAuraExecute = async (
  interaction: ChatInputCommandInteraction,
  dataSource: DataSource,
) => { 
    const userToRemoveAura = interaction.options.getUser("user")!
    const auraToRemove = interaction.options.getInteger("aura")!
    const userRepository = dataSource.getRepository(User)

    const user = await  userRepository.findOneBy({  discordId: userToRemoveAura?.id })

    if (!user) return;
    user.aura = user.aura - auraToRemove

    await userRepository.save(user)

    await interaction.reply({content: `Você acaba de remover ${auraToRemove} aura de ${userToRemoveAura}`})
}