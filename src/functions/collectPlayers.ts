import { TextChannel } from "discord.js";

export default async function helpEmbedBuilder(channel: TextChannel, event: any): Promise<any> {
    const collectorUsernameFilter = (m: any) => {
        return m.author.id === event.author.id
    }

    const reactionFilter = (_: any, user: any) => {
        return !user.bot && user.id === event.author.id
    }

    const users: any = []

    let botMessage

    try {
        const collected = await channel.awaitMessages({ filter: collectorUsernameFilter, max: 1, time: 60_000, errors: ['time'] })
        const userMessage = collected.first()

        if(userMessage) users.push(userMessage.content)
    } catch {
        return false
    } finally {
        botMessage = await channel.send('Seu time tem um terceiro player?')
        await botMessage.react('✅')
        await botMessage.react('❌')
    }

    try {
        const collected = await botMessage.awaitReactions({ filter: reactionFilter, time: 30_000, max: 1, errors: ['time'] })
        const userReaction = collected.first()

        botMessage.reactions.removeAll()

        if (userReaction?.emoji.name === '✅') {
            await botMessage.edit('Tudo certo, vamos repetir o processo, digite o nick do osu do seu segundo teamate:')

            try {
                const collected = await channel.awaitMessages({ filter: collectorUsernameFilter, max: 1, time: 60_000, errors: ['time'] })
                const userMessage = collected.first()
        
                if(userMessage) users.push(userMessage.content)
            } catch {
                return false
            }
        } else await botMessage.delete()

    } catch {
        return false
    } finally {
        return users
    }
}