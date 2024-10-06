import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import APICalls from './api/apiCalls'
import fs from 'fs'
import * as Functions from './functions/functions.export'

dotenv.config()

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
})

const api = new APICalls()

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user?.tag}`)
})

client.on('messageCreate', async (message) => {
    if(message.content === '%h' || message.content === '%help') {
        await Functions.helpEmbedBuilder(message)
    }

    if(message.content.startsWith('%es') || message.content.startsWith('%extractscores')) {
        try {
            const matchId = parseInt(message.content.split(' ')[1].split('/')[5])
            let warmups: number | undefined
            if(message.content.split(' ')[2]) {
                warmups = parseInt(message.content.split(' ')[2])
            } else warmups = undefined
            const createdFilePath = await api.getMatchScoresById(matchId, warmups)

            if(fs.existsSync(createdFilePath)) {
                message.react('✅')
                await message.author.send({
                    files: [createdFilePath]
                })

                fs.unlinkSync(createdFilePath)
            } else {
                message.reply('Erro ao gerar arquivo')
            }

        } catch {
            message.reply('MP Link inválido')
        }
    }

    if(message.content.startsWith('%s') || message.content.startsWith('%searchmp')) {
        let response
        let messageContent
        let createdFilePath

        try {
            
            const param_type: string = message.content.split(' ')[1]
            const param_value: string = message.content.split(' ')[2]

            if(!param_type || !param_value) {
                message.reply('You must have to insert valid params!')
                return
            }

            response = await api.getQueryMp(message, param_type, param_value)
            createdFilePath = response[0]
            messageContent = response[1]
            
        } catch {
            message.reply('Something went wrong...')
        } finally {      
            messageContent?.edit('All things ready, sending the txt!')

            if(fs.existsSync(createdFilePath)) {
                await message.channel.send({
                    files: [createdFilePath]
                })

                fs.unlinkSync(createdFilePath)
            } else {
                message.reply('Error on loading file')
            }

        }
    }
})

client.login(process.env.DISCORD_TOKEN)