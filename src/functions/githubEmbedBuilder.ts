import { EmbedBuilder } from 'discord.js'

export default async function githubEmbedBuilder(event: any): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor('Aqua')
        .setTitle("Kirby")
        .setURL('https://github.com/henrique117/kirbyBot')
        .setDescription('Hi! Check out my full open source code on Github! Feel free to drop a star!\n\nAlso, if u have any sugestions, you can DM me on my Discord (iccy11706)!')

    event.reply({ embeds: [embed] })
}