"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = helpEmbedBuilder;
async function helpEmbedBuilder(channel, event) {
    const collectorUsernameFilter = (m) => {
        return m.author.id === event.author.id;
    };
    const reactionFilter = (_, user) => {
        return !user.bot && user.id === event.author.id;
    };
    const users = [];
    let botMessage;
    try {
        const collected = await channel.awaitMessages({ filter: collectorUsernameFilter, max: 1, time: 60000, errors: ['time'] });
        const userMessage = collected.first();
        if (userMessage)
            users.push(userMessage.content);
    }
    catch {
        return false;
    }
    finally {
        botMessage = await channel.send('Seu time tem um terceiro player?');
        await botMessage.react('✅');
        await botMessage.react('❌');
    }
    try {
        const collected = await botMessage.awaitReactions({ filter: reactionFilter, time: 30000, max: 1, errors: ['time'] });
        const userReaction = collected.first();
        botMessage.reactions.removeAll();
        if (userReaction?.emoji.name === '✅') {
            await botMessage.edit('Tudo certo, vamos repetir o processo, digite o nick do osu do seu segundo teamate:');
            try {
                const collected = await channel.awaitMessages({ filter: collectorUsernameFilter, max: 1, time: 60000, errors: ['time'] });
                const userMessage = collected.first();
                if (userMessage)
                    users.push(userMessage.content);
            }
            catch {
                return false;
            }
        }
        else
            await botMessage.delete();
    }
    catch {
        return false;
    }
    finally {
        return users;
    }
}
