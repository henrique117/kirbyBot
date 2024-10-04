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
        try {

            let query: string | undefined
            let params: string | undefined

            if(message.content.split(' ')[1]) {

                query = message.content.split(' ')[1]
                if(message.content.split(' ')[2]) {
                    params = message.content.split(' ')[2]
                } else {
                    message.reply('Write a valid param')
                    return
                }

            } else {
                query = undefined
                params = undefined
            }

            let response
            let createdFilePath
            let messageContent

            try {
                response = await api.getQueryMp(message, query, params)
                createdFilePath = response[0]
                messageContent = response[1]
            } finally {
                messageContent?.edit(`Links ready! Sending the TXT file`)

                if(fs.existsSync(createdFilePath)) {

                    await message.channel.send({
                        files: [createdFilePath]
                    })
    
                    fs.unlinkSync(createdFilePath)
                } else {
                    message.reply('Erro ao gerar arquivo')
                }
            }
            
        } catch {
            message.reply('Ocorreu um erro')
        }
    }
})

client.login(process.env.DISCORD_TOKEN)