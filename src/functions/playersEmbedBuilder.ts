import { EmbedBuilder } from 'discord.js'

export default async function playerEmbedBuilder(usersVector: any): Promise<any> {

    const embedString = usersVector.join('\n') || 'Nenhum registro encontrado!'
    return new EmbedBuilder().setColor('Aqua').setTitle('Players achados online:').setDescription(embedString)

}