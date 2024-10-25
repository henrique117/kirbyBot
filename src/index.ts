import { ChannelType, Client, GatewayIntentBits, Message, PermissionsBitField, TextChannel } from 'discord.js'
import dotenv from 'dotenv'
import APICalls from './api/apiCalls'
import fs from 'fs'
import * as Functions from './functions/functions.export'
import { ManageGuildVariables } from './classes/classes.export'
import path from 'path'
import express from 'express'

dotenv.config()

const app = express()
const port =  process.env.PORT || 8080

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions]
})

const api = new APICalls()
const guildVariables = new ManageGuildVariables()

app.get('/kirby/auth', async (req, res) => {
    res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    const authorizationCode: any = req.query.code
    const state: any = req.query.state

    let user
    let guild

    if(state) {
        user = state.split(',')[0]
        guild = state.split(',')[1]
    }

    const osuUsername = await api.getUserFromAuth(authorizationCode)

    const targetGuild = client.guilds.cache.get(guild)

    if(!targetGuild) return console.log('Server não encontrado')

    const targetUser = targetGuild.members.fetch(user)

    if(!targetUser) return console.log('User não encontrado no server')

    ;(await targetUser).setNickname(osuUsername)
    ;(await targetUser).roles.add('1297726959077294090')
})

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

    app.listen(port, async () => {
        console.log(`\nServidor Express rodando na porta ${port}`)
    })
})

client.on('messageCreate', async (message) => {

    function checkPermissions(): boolean {
        const myBot = message.guild?.members.cache.get('1290083348827471872')
        if(myBot?.permissions.has('Administrator')) return true
        return false
    }

    if(message.content === '%auth' && message.channel.id === '1299405866973397012') {
        await message.react('✅')
        await message.author.send(`Clique no [link](https://osu.ppy.sh/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&scope=public+identify&state=${message.author.id},${message.guild?.id}) para autenticar seu perfil!`)
        if(message) setTimeout(async () => {
            await message.delete()
        }, 3000);
    }

    if(message.content === '%inv' && message.channel.id === '1299009626427359232') {
        let botMessage
        let players
        try {
            botMessage = await message.reply('Procurando os 5 digitos safados online...')

            players = await api.get5digitsOnline()
        } catch {
            await botMessage?.edit('Houve um erro ao procurar os players')
        } finally {
            const playersString = players.join('\n')
            fs.writeFileSync(path.resolve(__dirname, './players_online.txt'), playersString)
            if(fs.existsSync(path.resolve(__dirname, './players_online.txt'))) {
                await botMessage?.edit({ content: `Tudo pronto, players achados online:`, files: [path.resolve(__dirname, './players_online.txt')] })
                fs.unlinkSync(path.resolve(__dirname, './players_online.txt'))
            } else {
                await botMessage?.edit('Houve um erro ao gerar arquivo')
            }
        }
    }

    if(message.content === '%h' || message.content === '%help') {
        await Functions.helpEmbedBuilder(message)
    }

    if(message.content === '%git' || message.content === '%github') {
        await Functions.githubEmbedBuilder(message)
    }

    if(message.content.startsWith('%es') || message.content.startsWith('%extractscores')) {
        
        const member = message.guild?.members.cache.get(message.author.id)

        if(!member?.permissions.has('Administrator') || message.author.id !== '520994132458471438') return message.reply('Only admins can use this command!!')

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
                    })
                    guildConfigs.capRole = role?.id
                } catch (err) {
                    console.error(err)
                    return message.reply('Não consegui criar o cargo de Capitão.')
                }
            } else {
                guildConfigs.capRole = captainRole.id
            }            

            if (!playerRole) {
                try {
                    const role = await guildRoles?.create({
                        name: 'Capitao',
                        color: 'Fuchsia',
                        permissions: ['SendMessages', 'ViewChannel']
                    })
                    guildConfigs.capRole = role?.id
                } catch (err) {
                    console.error(err)
                    return message.reply('Não consegui criar o cargo de Capitão.')
                }
            } else {
                guildConfigs.plaRole = playerRole.id
            }

            if (!freeRole) {
                try {
                    const role = await guildRoles?.create({
                        name: 'Free Agent',
                        color: 'LightGrey',
                        permissions: ['SendMessages', 'ViewChannel']
                    })
                    guildConfigs.faRole = role?.id
                } catch (err) {
                    console.error(err)
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

    if (message.content === '%tb5' && message.guild?.id === '1297726959014383676') {

        if (!checkPermissions()) return message.reply('Add me permissions!!')
        
        const checkTournmentConfig = guildVariables.getGuildConfig(message.guild?.id)
        if (!checkTournmentConfig?.tournment_configs) {
            return message.reply('Turn on the tournment configs using <%tc on> or <%tournmentconfigs on>')
        }
    
        const channelName = `${message.author.username}`
        let newChannel: TextChannel | undefined
    
        const guildUser = await message.guild?.members.fetch(message.author.id)
    
        message.react('✅')
    
        if (!channelName) return message.reply('No name channel')
    
        try {
            newChannel = await message.guild?.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: message.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: message.author.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    }
                ],
                reason: `Registro de ${message.author.globalName}`,
            })
        } catch (error) {
            console.error(error)
            return message.reply("Something went wrong")
        }
    
        if (!newChannel) return
    
        let osuUsername: string
        let botMessages: Message<true> | undefined
    
        await newChannel.send(`<@${message.author.id}> Manda o ID do seu perfil do Osu! aqui:`)
    
        const collectorFilter = (m: Message) => {
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
    
            const reactionFilter = (_: any, user: any) => {
                return !user.bot && user.id === message.author.id
            }
    
            const collectedReactions = await botMessages?.awaitReactions({ filter: reactionFilter, time: 30_000, max: 1, errors: ['time'] })
            const userReaction = collectedReactions?.first()
    
            if (userReaction?.emoji.name === '❌') {
                await botMessages.edit('Ótimo, vou te dar o cargo de Free Agent para poder procurar algum time! Caso já tenha time combinado, peça para o seu capitão registrar o time usando o mesmo comando!')
    
                const response = guildVariables.getGuildConfig(message.guild?.id)
                const faRole = response?.fa_role_id
    
                try {
                    if (faRole && guildUser) guildUser.roles.add(faRole)
                } catch (error) {
                    console.error('Erro ao adicionar o cargo de Free Agent:', error)
                }
    
            } else {
                await botMessages.edit({
                    content: 'Ótimo, digite o username do discord do seu primeiro teamate:',
                    files: [{
                        attachment: path.resolve(__dirname, './assets/username.png'),
                    }],
                })
    
                await botMessages.reactions.removeAll()
    
                const teamates = await Functions.collectPlayers(newChannel, message)
    
                if (!teamates) throw new Error('Teamates não encontrados')
    
                let player1, player2, teamate1Username, teamate2Username
    
                try {
                    
                    player1 = await message.guild?.members.fetch({ query: teamates[0], limit: 1 }).then(members => members.first())
    
                    if (teamates[2]) {
                        player2 = await message.guild?.members.fetch({ query: teamates[2], limit: 1 }).then(members => members.first())
                    }
    
                    botMessages = await newChannel.send('Trocando o nome dos teamates...')
    
                    if (player1) {
                        teamate1Username = await api.getUserById(parseInt(teamates[1]))
                        player1.setNickname(`${teamate1Username}`)
                    }
    
                    if (teamates[2] && player2) {
                        teamate2Username = await api.getUserById(parseInt(teamates[1]))
                        player2.setNickname(`${teamate2Username}`)
                    }
    
                } catch (error) {
                    console.error('Erro ao trocar nomes dos teamates:', error)
                    await botMessages.edit('Algo deu errado...')
                } finally {
                    await botMessages.edit('Ok, tudo certo, por último, qual é o nome do seu time?')
                }
    
                const collectorTeamFilter = (m: Message) => {
                    return m.author.id === message.author.id
                }
    
                let teamName: any
    
                try {
                    const collected = await newChannel.awaitMessages({ filter: collectorTeamFilter, time: 30_000, errors: ['time'], max: 1 })
                    teamName = collected.first()
                } catch (error) {
                    console.error('Erro ao coletar o nome do time:', error)
                } finally {
                    try {

                        let findRole = message.guild?.roles.cache.find(role => {
                            return role.name === teamName.content
                        })

                        if (teamName && !findRole) {
                            const role = await message.guild?.roles.create({
                                name: teamName.content,
                                color: 'LightGrey',
                                permissions: ['SendMessages', 'ViewChannel'],
                            })
    
                            if (role && player1 && guildUser) {
                                guildUser.roles.set([])
                                player1.roles.set([])
                                guildUser.roles.add(role.id)
                                player1.roles.add(role.id)
                                if (teamates[2] && player2) {
                                    player2.roles.set([])
                                    player2.roles.add(role.id)
                                }
                            }

                            const guildIDRoles = guildVariables.getGuildConfig(message.guild?.id)
                            const playerRole = guildIDRoles?.player_role_id
                            const captainRole = guildIDRoles?.captain_role_id
                            
                            if(guildIDRoles && playerRole && captainRole && guildUser && player1) {
                                guildUser.roles.add(captainRole)
                                guildUser.roles.add(playerRole)
                                guildUser.roles.add('1297726959077294090')
                                player1.roles.add(playerRole)
                                player1.roles.add('1297726959077294090')
                                if (teamates[2] && player2) {
                                    player2.roles.add(playerRole)
                                    player2.roles.add('1297726959077294090')
                                }
                            }

                            // gambiarrazinha

                            return await newChannel.send('Tudo pronto! Muito obrigado por ter se cadastrado! Bem vindo a TB5!!!')
                        }

                        if(findRole) return await newChannel.send('Já existe um time com esse nome! Tente novamente fazer o cadastro!')

                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        } catch (error) {
            await botMessages?.edit('Você demorou muito para responder! Tente refazer o cadastro novamente!')
            setTimeout(async () => {
                await newChannel.delete()
            }, 5000)
        } finally {
            setTimeout(async () => {
                await newChannel.delete()
            }, 5000)
        }
    }

    if(message.content.startsWith('%s') || message.content.startsWith('%searchmp')) {

        // return message.reply('The bot is on dev mode and this command is current offline!! Sorry')

        const member = message.guild?.members.cache.get(message.author.id)

        if(!member?.permissions.has('Administrator') || message.author.id !== '520994132458471438') return message.reply('Only admins can use this command!!')

        let response
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

        }
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