import { Client, TextChannel, EmbedBuilder } from "discord.js";
import cron from "node-cron";
import { AppDataSource } from "..";
import { User } from "../models/user";
import { envs } from "../config/envs";
import { getCurrentDateSaoPaulo } from "../utils/dateUtils";

const AURA_CHANNEL_ID = envs.AURA_CHANNEL_ID;

const TRASH_TALK_PHRASES = [
  "Um frango desse não alimenta nem um mendigo... credo.",
  "Tá com medo de ficar forte? Vai treinar!",
  "Esse shape aí tá mais pra palito de dente do que pra homem.",
  "Achei que era dia de treino, não de fazer gracinha.",
  "Com esse físico aí, só se for pra competir no concurso de magrelo.",
  "Tá esperando o que? Os músculos crescerem sozinhos?",
  "Esse braço aí nem pra abrir pote de maionese serve.",
  "Frango é no KFC, não na academia. Bora treinar!",
  "Tá com medo de suar? Ou de ficar forte?",
  "Esse shape aí nem pra foto fake do Tinder presta.",
  "Cadê a dedicação? Dormiu abraçado com o travesseiro de novo?",
  "Um dia sem treinar é um dia a mais pro shape de palito.",
  "Quem não aparece na academia, não aparece no espelho também.",
  "Vai ficar aí esperando milagre ou vai treinar?",
  "Com esse braço fino desse jeito, até criança ganha no braço de ferro.",
  "Esse shape tá parecendo refugiado de guerra, vai treinar!",
  "Magrelo assim nem som faz quando bate no peito.",
  "Tá fraco demais, até a vó levanta mais peso que você.",
  "Com esse corpo aí só se for pra competir na categoria mosquito.",
  "Perna de grilo, braço de palito. Vai treinar ou não?",
  "Esse bíceps aí nem bolinha faz quando contrai kkkkk",
  "Tá parecendo o Magrelo do Scooby-Doo, velho.",
  "Com essa barriga aí, academia virou churrascaria?",
  "Tá gordo ou grávido? Fica difícil saber...",
  "Essa barriga tá escondendo os pés? Credo!",
  "Shape de sedentário, vai treinar logo!",
  "Esse tanquinho virou galão de 20 litros kkkkk",
  "Tá mais pra Zé Gotinha do que pra bodybuilder.",
  "Falou que tava treinando mas tá com cara de quem só come bolacha.",
  "Com esse shape aí não entra nem no programa do Ratinho.",
  "Tá parecendo um saco de batata com perna.",
  "Esse corpo aí tá pedindo uma academia urgente!",
  "Vai ficar gordinho assim pra sempre?",
  "Com esse corpinho aí nem pra avatar do GTA serve.",
  "Tá parecendo que não conhece academia nem por foto.",
  "Esse corpinho de frango assado tá precisando de ferro!",
  "Nem suplemento salva esse shape aí não, viu?",
  "Tá parecendo aqueles boneco inflável de posto de gasolina.",
  "Com essa genética ruim aí tem que treinar dobrado!",
  "Esse shape tá gritando por ajuda, cara!",
  "Tá mais pra saco de pancada do que pra lutador.",
  "Parece que nunca pegou um peso na vida.",
  "Com esse corpinho aí até o Perna de Pau ri.",
  "Tá parecendo espaguete cru, vai endurecer!",
  "Esse shape tá pedindo demissão da preguiça.",
  "Fraco demais, nem pra carregar as compras serve.",
  "Com esse corpo aí só falta colocar placa de 'em construção'.",
  "Tá mais murcho que balão de festa velha.",
  "Esse shape tá em modo econômico, liga o turbo!",
  "Parece que treina só de olhar os outros malhando.",
];

const PHOTO_ROAST_PHRASES = [
  "KKKKKK olha o shape desse aí! {user}, cadê os músculos?",
  "Eita {user}, isso aí é braço ou antena de rádio?",
  "{user} postou foto do treino mas esqueceu de treinar kkkkk",
  "Esse shape do {user} tá mais pra 'antes' do que pra 'depois'",
  "{user}, se continuar assim vai virar palito de churrasco",
  "Olha o tanquinho do {user}... só que não! Bora treinar mais!",
  "Esse shape aí tá precisando de MUITO trabalho, {user}",
  "{user} treinou ou só tirou foto? Fica a dúvida...",
  "{user} achando que tá bombado com esse corpinho aí kkkkk",
  "Olha o shape de {user}! Tá treinando ou brincando?",
  "{user} postou mas tá parecendo que não malha há anos",
  "Esse shape do {user} tá precisando de umas 500 horas de treino",
  "Pô {user}, isso aí é músculo ou massinha de modelar?",
  "{user} treinou hoje ou só foi lá pra selfie?",
  "Esse braço do {user} tá fino demais, credo!",
  "Olha o {user} achando que tá grande kkkkk",
  "{user} com esse shape aí só se for pra concurso de magrelo",
  "Eita {user}, tá treinando com peso de isopor?",
  "{user} postou foto mas cadê o shape?",
  "Olha o corpinho de {user}! Tá treinando de mentirinha?",
  "{user} com esse físico aí nem pra filme de comédia",
  "Pô {user}, esse corpo aí tá pedindo socorro!",
  "{user} achando que tá fitness com esse shape de palito",
  "Esse físico do {user} tá parecendo que só treina dedo no celular",
  "{user} com esse corpo aí até eu consigo levantar você no colo",
  "Olha o shape de franguinho do {user} kkkkk",
  "{user} postou mas esqueceu de crescer os músculos antes",
  "Pô {user}, isso aí é perna ou canudo de refri?",
  "{user} com esse braço fino assim nem cobra faz efeito",
  "Esse shape do {user} tá pedindo uma reconstrução completa",
  "{user} treinou ou só foi fazer turismo na academia?",
  "Olha a barriguinha do {user}! Academia ou boteco?",
  "{user} tá postando foto mas o shape não aparece",
  "Eita {user}, com esse corpo aí tá parecendo que desistiu",
  "{user} achando que tá monstro com esse corpinho aí",
  "Pô {user}, esse shape tá pedindo ajuda profissional",
  "{user} com esse físico aí só se for pra assustar criança",
  "Olha o tanquinho do {user}... tá mais pra panela!",
  "{user} postou mas a foto tá pior que a realidade",
  "Esse shape do {user} tá precisando de milagre",
  "{user} com esse corpo aí nem pra foto de perfil serve",
  "Pô {user}, tá treinando ou tá indo lá pra conversar?",
  "{user} achando que tá fitness mas tá mais pra desnutrido",
  "Olha o corpinho de {user}! Precisa de urgência na academia!",
  "{user} com esse shape só se for pra fazer rir",
  "Eita {user}, isso aí é bíceps ou picada de mosquito?",
  "{user} postou foto mas esqueceu de malhar antes",
  "Esse físico do {user} tá parecendo que nunca viu uma academia",
  "{user} com esse corpo aí tá parecendo que treina só de mentirinha",
  "Pô {user}, esse shape tá pedindo demissão da preguiça",
  "{user} achando que tá forte mas tá mais pra fraco",
];

const ABSENCE_PHRASES = [
  "{user} SUMIU! Já faz {days} dia(s) sem treinar! Tá com medo?",
  "Opa {user}, {days} dia(s) sem aparecer! Desistiu ou tá com preguiça?",
  "{user} há {days} dia(s) sem dar as caras! Cadê você?",
  "ATENÇÃO: {user} está {days} dia(s) sumido! Alguém viu ele?",
  "{user}, {days} dia(s) sem treinar... os músculos tão chorando!",
  "Faz {days} dia(s) que {user} não aparece! Tá precisando de motivação?",
  "{user} abandonou a gente! {days} dia(s) de ausência!",
  "{user} tá {days} dia(s) sem treinar! Desistiu do shape?",
  "Pô {user}, {days} dia(s) sumido! Tá com medo de pegar peso?",
  "{user} há {days} dia(s) desaparecido! Virou sedentário?",
  "Olha só, {user} tá {days} dia(s) sem aparecer! Esqueceu da academia?",
  "{user} AUSENTE há {days} dia(s)! Tá esperando o que pra voltar?",
  "Faz {days} dia(s) que {user} não dá as caras! Tá com vergonha?",
  "{user}, {days} dia(s) sem treinar! Os músculos tão derretendo!",
  "Cadê você {user}? {days} dia(s) de sumiço total!",
  "{user} tá {days} dia(s) sem aparecer! Tá doente ou com preguiça?",
  "Opa {user}! {days} dia(s) sem treinar! Desanimou?",
  "{user} sumiu há {days} dia(s)! Tá precisando de motivação ou de vergonha?",
  "{user}, {days} dia(s) de ausência! Tá fazendo o que? Comendo pizza?",
  "Já faz {days} dia(s) que {user} não aparece! Virou fantasma?",
  "{user} tá há {days} dia(s) sem treinar! Tá com medo de crescer?",
  "{user} DESAPARECEU! {days} dia(s) sem dar sinal de vida na academia!",
  "Pô {user}, {days} dia(s) sem aparecer! Tá ficando fraco de novo?",
  "{user} há {days} dia(s) sumido! Tá esperando milagre?",
  "{user}, {days} dia(s) sem treinar! O shape tá voltando pro começo!",
  "Faz {days} dia(s) que {user} abandonou a academia! Vai voltar quando?",
  "{user} tá {days} dia(s) sem aparecer! Tá esperando os músculos crescerem sozinhos?",
  "Cadê {user}? {days} dia(s) de sumiço! Tá com medo de suar?",
  "{user}, {days} dia(s) sem treinar! Vai perder tudo que conquistou!",
  "Olha só, {user} tá {days} dia(s) sumido! Tá de férias do shape?",
  "{user} AUSENTE há {days} dia(s)! Tá esperando segunda-feira pra sempre?",
  "{user}, {days} dia(s) sem aparecer! Os outros tão passando você!",
  "Faz {days} dia(s) que {user} não treina! Tá virando palito de novo?",
  "{user} há {days} dia(s) desaparecido! Tá com vergonha do corpo?",
  "{user}, {days} dia(s) de ausência! Vai voltar ou desistiu?",
  "{user} sumiu há {days} dia(s)! Tá esperando o corpo mudar sozinho?",
  "Pô {user}, {days} dia(s) sem treinar! Tá virando frango de novo?",
  "{user} tá {days} dia(s) sem aparecer! Desanimou do shape?",
  "{user}, {days} dia(s) sumido! A academia tá sentindo sua falta... ou não!",
  "Já faz {days} dia(s) que {user} não dá as caras! Tá com preguiça crônica?",
  "{user} há {days} dia(s) sem treinar! Vai ficar gordo assim?",
  "{user} DESAPARECEU há {days} dia(s)! Tá esperando o shape voltar sozinho?",
  "{user}, {days} dia(s) de sumiço! Tá dormindo demais?",
  "Faz {days} dia(s) que {user} não aparece! Tá com medo de crescer?",
  "{user} tá {days} dia(s) sem treinar! Vai ficar fraco pra sempre?",
  "{user} há {days} dia(s) sumido! Tá esperando motivação cair do céu?",
  "Cadê você {user}? {days} dia(s) sem aparecer! Virou sofá?",
  "{user}, {days} dia(s) sem treinar! O shape tá chorando!",
  "{user} AUSENTE há {days} dia(s)! Tá esperando o que pra acordar?",
  "{user}, {days} dia(s} de ausência! Tá ficando molenga?",
  "Pô {user}, {days} dia(s) sumido! Vai perder tudo que ganhou!",
];

function getRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function setupTrashTalkingCron(client: Client) {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    if (dayOfWeek === 0) {
      return;
    }

    try {
      const channel = await client.channels.fetch(AURA_CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) {
        console.error("Canal de aura não encontrado ou não é TextChannel");
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const allUsers = await userRepository.find();
      
      for (const user of allUsers) {
        if (!user.updatedAt) continue;

        const lastUpdate = new Date(user.updatedAt);
        const diffTime = now.getTime() - lastUpdate.getTime();
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffHours < 24) continue;

        const lastCharge = user.lastChargeDate ? new Date(user.lastChargeDate) : null;
        const shouldCharge = !lastCharge ||
          (now.getTime() - lastCharge.getTime()) >= 24 * 60 * 60 * 1000;

        if (shouldCharge) {
          const phrase = getRandomPhrase(ABSENCE_PHRASES)
            .replace("{user}", `<@${user.discordId}>`)
            .replace("{days}", diffDays.toString());

          const trashTalk = getRandomPhrase(TRASH_TALK_PHRASES);

          await channel.send(`${phrase}\n\n${trashTalk}`);

          user.lastChargeDate = getCurrentDateSaoPaulo();
          await userRepository.save(user);

          console.log(`Cobrança enviada para usuário ${user.discordId} (${diffDays} dias sem treinar)`);
        }
      }
    } catch (error) {
      console.error("Erro ao executar cron de cobrança:", error);
    }
  });

  console.log("Sistema de cobrança automática individual ativado (verifica a cada minuto, exceto domingo)");

  cron.schedule("59 23 * * *", async () => {
    try {
      const channel = await client.channels.fetch(AURA_CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) {
        console.error("Canal de ranking não encontrado ou não é TextChannel");
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const topUsers = await userRepository.find({
        order: { aura: "DESC" },
      });

      if (topUsers.length === 0) {
        await channel.send("Nenhum usuário no ranking ainda!");
        return;
      }

      const rankingText = await Promise.all(
        topUsers.map(async (user, index) => {
          try {
            const discordUser = await client.users.fetch(user.discordId);
            const username = discordUser.username;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "💪";
            return `${medal} **${index + 1}º** - ${username}: **${user.aura}** aura`;
          } catch (error) {
            return `💪 **${index + 1}º** - Usuário desconhecido: **${user.aura}** aura`;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setTitle("🏆 RANKING DIÁRIO DE AURA 🏆")
        .setDescription(rankingText.join("\n"))
        .setColor("#FFD700")
        .setTimestamp()
        .setFooter({ text: "Atualizado diariamente às 23:59" });

      await channel.send({ embeds: [embed] });

      console.log("Ranking diário enviado com sucesso");
    } catch (error) {
      console.error("Erro ao enviar ranking diário:", error);
    }
  });

  console.log("Sistema de ranking diário ativado (23:59 diariamente)");
}

export function sendPhotoRoast(client: Client, userId: string) {
  const phrase = getRandomPhrase(PHOTO_ROAST_PHRASES).replace("{user}", `<@${userId}>`);
  return phrase;
}
