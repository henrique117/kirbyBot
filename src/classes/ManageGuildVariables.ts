import { GuildConfigInterface } from '../interfaces/interfaces.export'
import fs from 'fs'
import path from 'path'

export default class ManageGuildVariables {
    private guildConfigs: GuildConfigInterface[]
    private filePath: string

    constructor() {
        this.guildConfigs = []
        this.filePath = path.resolve(__dirname, '../servers_variables.json')
    }

    public setGuildConfig(guildId: string | undefined, tournmentConfigs: boolean, playerRoleId?: string, captainRoleId?: string, faRoleId?: string) {
        const existingConfigIndex = this.guildConfigs.findIndex(config => config.guild_id === guildId)

        if (existingConfigIndex !== -1) {
            this.guildConfigs[existingConfigIndex].tournment_configs = tournmentConfigs
        } else {
            if(!guildId) return

            this.guildConfigs.push({
                guild_id: guildId,
                tournment_configs: tournmentConfigs,
                player_role_id: playerRoleId,
                captain_role_id: captainRoleId,
                fa_role_id: faRoleId
            })
        }
    }

    public getGuildConfig(guildId?: string): GuildConfigInterface | undefined {
        if(guildId) return this.guildConfigs.find(config => config.guild_id === guildId)
    }

    public saveGuildVariables(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.guildConfigs, null, 2))
    }

    public loadGuildVariables(): void {
        if(fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath, 'utf-8')
            this.guildConfigs = JSON.parse(data)
        }
    }
}
