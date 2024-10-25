"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = playerEmbedBuilder;
const discord_js_1 = require("discord.js");
async function playerEmbedBuilder(usersVector) {
    const embedString = usersVector.join('\n') || 'Nenhum registro encontrado!';
    return new discord_js_1.EmbedBuilder().setColor('Aqua').setTitle('Players achados online:').setDescription(embedString);
}
