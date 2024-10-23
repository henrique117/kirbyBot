"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = githubEmbedBuilder;
const discord_js_1 = require("discord.js");
async function githubEmbedBuilder(event) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('Aqua')
        .setTitle("Kirby")
        .setURL('https://github.com/henrique117/kirbyBot')
        .setDescription('Hi! Check out my full open source code on Github! Feel free to drop a star!\n\nAlso, if u have any sugestions, you can DM me on my Discord (iccy11706)!');
    event.reply({ embeds: [embed] });
}
