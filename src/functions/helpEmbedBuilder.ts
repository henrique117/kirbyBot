import { EmbedBuilder } from 'discord.js'

export default async function helpEmbedBuilder(event: any): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor('Aqua')
        .setTitle("COMANDS (The params with '?' are optional)")
        .addFields(
            { name: '%es or %extractscores | Params: <link>', value: 'Create a JSON file with the MP scores (Easier to make sheets)' },
            { name: '%s or %searchmp | Params: <-name> <text>', value: 'Search for MP links and send them (You can search by name using -name or -n)'}
        )

    event.reply({ embeds: [embed] })
}