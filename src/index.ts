import { Client, GatewayIntentBits, Message, PermissionsBitField, TextChannel } from 'discord.js'
import dotenv from 'dotenv'
import APICalls from './api/apiCalls'
import fs from 'fs'
import * as Functions from './functions/functions.export'
import { ManageGuildVariables } from './classes/classes.export'

dotenv.config()

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions]
})

const api = new APICalls()
const guildVariables = new ManageGuildVariables()

process.on('SIGINT', () => {
    console.log('\nBot está sendo desligado...')
    try {
        guildVariables.saveGuildVariables()
    } catch {
        console.log('Houve erro ao salvar as variáveis')
    }
})

process.on('uncaughtException', (err) => {
    console.log('O bot foi desligado por erros!', err)
    try {
        guildVariables.saveGuildVariables()
    } catch {
        console.log('Não foi possível salvar as variáveis...')
    }
})

process.on('beforeExit', () => {
    console.log('O Node está desligando o bot...')
    try {
        guildVariables.saveGuildVariables()
    } catch {
        console.log('Houve erro ao salvar as variáveis')
    }
})

client.once('ready', async () => {
    const guilds = client.guilds.cache.map(guild => guild.name)
    console.log(`\nBot conectado como ${client.user?.tag} nos servidores:\n`)
    guilds.forEach(guild => console.log(guild))

    try {
        console.log('\nCarregando variáveis dos servidores...')
        guildVariables.loadGuildVariables()
    } catch(error) {
        console.log('Houve erro ao carregar as variáveis')
    } finally {
        console.log('Variáveis carregadas!')
    }
})

client.on('messageCreate', async (message) => {

    function checkPermissions(): boolean {
        const myBot = message.guild?.members.cache.get('1290083348827471872')
        if(myBot?.permissions.has('Administrator')) return true
        return false
    }

    if(message.content === '%h' || message.content === '%help') {
        await Functions.helpEmbedBuilder(message)
    }

    if(message.content === '%git' || message.content === '%github') {
        await Functions.githubEmbedBuilder(message)
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

    if(message.content === '%tournmentconfigs on' || message.content === '%tc on') {
        const member = message.guild?.members.cache.get(message.author.id)
        const guildRoles = message.guild?.roles

        if(!member?.permissions.has('Administrator')) return message.reply('Only admins can use this command!!')

        if(!checkPermissions()) return message.reply('Add me permissions!!')

        try {
            interface LilThing {
                id: string | undefined
                tc: boolean
                capRole?: string
                plaRole?: string
                faRole?: string
            }

            const guildConfigs: LilThing = {id: message.guild?.id, tc: true}

            let captainRole = guildRoles?.cache.find(role => role.name.toLowerCase() === 'capitao')
            let playerRole = guildRoles?.cache.find(role => role.name.toLowerCase() === 'player')
            let freeRole = guildRoles?.cache.find(role => role.name.toLowerCase() === 'free agent')

            if (!captainRole) {
                try {
                    const role = await guildRoles?.create({
                        name: 'Capitao',
                        color: 'Fuchsia',
                        permissions: ['SendMessages', 'ViewChannel']
                    });
                    guildConfigs.capRole = role?.id
                } catch (err) {
                    console.error(err);
                    return message.reply('Não consegui criar o cargo de Capitão.')
                }
            } else {
                guildConfigs.capRole = captainRole.id;
            }            

            if (!playerRole) {
                try {
                    const role = await guildRoles?.create({
                        name: 'Capitao',
                        color: 'Fuchsia',
                        permissions: ['SendMessages', 'ViewChannel']
                    });
                    guildConfigs.capRole = role?.id
                } catch (err) {
                    console.error(err);
                    return message.reply('Não consegui criar o cargo de Capitão.')
                }
            } else {
                guildConfigs.plaRole = playerRole.id;
            }

            if (!freeRole) {
                try {
                    const role = await guildRoles?.create({
                        name: 'Free Agent',
                        color: 'LightGrey',
                        permissions: ['SendMessages', 'ViewChannel']
                    });
                    guildConfigs.faRole = role?.id
                } catch (err) {
                    console.error(err);
                    return message.reply('Não consegui criar o cargo de Capitão.')
                }
            } else {
                guildConfigs.faRole = freeRole.id
            }

            guildVariables.setGuildConfig(guildConfigs.id, guildConfigs.tc, guildConfigs.plaRole, guildConfigs.capRole, guildConfigs.faRole)
        } catch {
            console.log('aaaaaaaaaa')
        } finally {
            message.react('✅')
        }
    }

    if (message.content === '%feio') {

        if (!checkPermissions()) return message.reply('Add me permissions!!')
        const checkTournmentConfig = guildVariables.getGuildConfig(message.guild?.id) 
        if(!checkTournmentConfig?.tournment_configs) return message.reply('Turn on the tournment configs using <%tc on> or <%tournmentconfigs on>')

        const channelName = `${message.author.globalName}`
        let newChannel: TextChannel | undefined
    
        const guildUser = await message.guild?.members.cache.get(message.author.id)
    
        message.react('✅')
    
        if (!channelName) return message.reply('No name channel')
    
        try {
            newChannel = await message.guild?.channels.create({
                name: channelName,
                type: 0,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: message.author.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                reason: `Registro de ${message.author.globalName}`
            })
        } catch (error) {
            console.error(error)
            return message.reply("Something went wrong")
        }
    
        if (!newChannel) return
    
        let osuUsername: string
        let botMessages: Message<true> | undefined
    
        await newChannel.send(`<@${message.author.id}> Manda o ID do seu perfil do Osu! aqui:`)
    
        const collectorFilter = (m: any) => {
            return m.author.id === message.author.id && /^[0-9]+$/.test(m.content)
        }
    
        try {
            const collected = await newChannel.awaitMessages({ filter: collectorFilter, max: 1, time: 30_000, errors: ['time'] })
            const userMessage = collected.first()
    
            botMessages = await newChannel.send('Procurando seu perfil...')
    
            if (userMessage) {
                osuUsername = await api.getUserById(parseInt(userMessage.content))
    
                if (guildUser) {
                    await guildUser.setNickname(`${osuUsername}`)
                }
    
                await botMessages.edit(`Achei! Seu nome no servidor agora foi trocado, não precisa se preocupar com isso`)
            }
        } catch {
            await newChannel.send('Você demorou muito para responder! Tente novamente.')
            return newChannel.delete()
        }
    
        try {
            await botMessages?.edit('Ok, você está como capitão do seu time?')
            await botMessages?.react('✅')
            await botMessages?.react('❌')
    
            const reactionFilter = (reaction: any, user: any) => {
                return !user.bot && user.id === message.author.id
            }
    
            const collectedReactions = await botMessages?.awaitReactions({ filter: reactionFilter, time: 30_000, max: 1, errors: ['time'] })
            const userReaction = collectedReactions?.first()
    
            if (userReaction?.emoji.name === '❌') {

                await botMessages.edit('Ótimo, vou te dar o cargo de Free Agent para poder procurar algum time! Caso já tenha time combinado, peça para o seu capitão registrar o time usando o mesmo comando!')
                let hasTheRole = guildUser?.roles.cache.find(role => role.name.toLowerCase() === 'free agent')
                if(hasTheRole) return
                const response = guildVariables.getGuildConfig(message.guild?.id)
                const faRole = response?.fa_role_id
                
                try {
                    if(faRole) guildUser?.roles.add(faRole)
                } catch(error) {
                    console.error('bbbbbbbbbbb')
                }

            } else {
                await botMessages.edit('Ótimo, preciso que mande o seu time com o seguinte formato:\n\nNome do time\n@teamate1 - ID do osu teamate1\n@teamate2 - ID do osu teamate2\n...')
            }
    
            await botMessages.reactions.removeAll()
    
            setTimeout(() => {
                newChannel.delete()
            }, 5000)
        } catch {
            await botMessages?.edit('Você demorou muito para responder! Tente refazer o cadastro novamente!')
            setTimeout(() => {
                newChannel.delete()
            }, 5000)
        }
    }
    

    if(message.content.startsWith('%s') || message.content.startsWith('%searchmp')) {
        message.reply("This command is disabled for now... Try again later!")
        /* let response
        let messageContent
        let createdFilePath

        try {
            
            const param_type: string = message.content.split(' ')[1]
            let param_value: string

            if(message.content.split('"').length > 1) {
                param_value = message.content.split('"')[1]
            } else param_value = message.content.split(' ')[2]

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

        } */
    }
})

client.on('guildCreate', guild => {
    const botMember = guild.members.me

    if (!botMember) {
        console.log('O bot não conseguiu acessar suas informações de membro no servidor.')
        return
    }

    let channel = guild.channels.cache.find(channel => 
        channel.type === 0 && channel.permissionsFor(botMember).has('SendMessages')
    )
    
    if (channel && channel.isTextBased()) {
        channel.send(`Thank you for adding me into the server! Please make sure to add all the permissions for the bot!\n\nHope you guys can enjoy it! :heart::heart::heart:`)
    } else {
        console.log(`Não foi possível encontrar um canal para enviar mensagem em ${guild.name}`)
    }

    guildVariables.setGuildConfig(guild.id, false)
})


client.login(process.env.DISCORD_TOKEN)