"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = helpEmbedBuilder;
const discord_js_1 = require("discord.js");
async function helpEmbedBuilder(event) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('Aqua')
        .setTitle("COMANDS (The params with '?' are optional)")
        .addFields({ name: '%es or %extractscores | Params: <link>', value: 'Create a JSON file with the MP scores (Easier to make sheets)' }, { name: '%s or %searchmp | Params: <-name> <text>', value: 'Search for MP links and send them (You can search by name using -name or -n)' }, { name: '%git or %github', value: 'Kirby is open source! Check out the github repository!' }, { name: '%tb5', value: 'Register you and your team to the server!' });
    event.reply({ embeds: [embed] });
}
