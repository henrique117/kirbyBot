"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = helpEmbedBuilder;
async function helpEmbedBuilder(channel, event) {
    const collectorUsernameFilter = (m) => {
        return m.author.id === event.author.id;
    };
    const collectorIDFilter = (m) => {
        return m.author.id === event.author.id && /^[0-9]+$/.test(m.content);
    };
    const reactionFilter = (_, user) => {
        return !user.bot && user.id === event.author.id;
    };
    const users = [];
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
        await channel.send('Agora digite o ID do Osu! desse usuário:');
    }
    let botMessage;
    try {
        const collected = await channel.awaitMessages({ filter: collectorIDFilter, max: 1, time: 60000, errors: ['time'] });
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
            await botMessage.edit('Tudo certo, vamos repetir o processo, digite o username do seu segundo teamate:');
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
                await channel.send('Agora digite o ID do Osu! desse usuário:');
            }
            try {
                const collected = await channel.awaitMessages({ filter: collectorIDFilter, max: 1, time: 60000, errors: ['time'] });
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
