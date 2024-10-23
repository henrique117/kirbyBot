"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ManageGuildVariables {
    constructor() {
        this.guildConfigs = [];
        this.filePath = path_1.default.resolve(__dirname, '../servers_variables.json');
    }
    setGuildConfig(guildId, tournmentConfigs, playerRoleId, captainRoleId, faRoleId) {
        const existingConfigIndex = this.guildConfigs.findIndex(config => config.guild_id === guildId);
        if (existingConfigIndex !== -1) {
            this.guildConfigs[existingConfigIndex].tournment_configs = tournmentConfigs;
        }
        else {
            if (!guildId)
                return;
            this.guildConfigs.push({
                guild_id: guildId,
                tournment_configs: tournmentConfigs,
                player_role_id: playerRoleId,
                captain_role_id: captainRoleId,
                fa_role_id: faRoleId
            });
        }
    }
    getGuildConfig(guildId) {
        if (guildId)
            return this.guildConfigs.find(config => config.guild_id === guildId);
    }
    saveGuildVariables() {
        fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.guildConfigs, null, 2));
    }
    loadGuildVariables() {
        if (fs_1.default.existsSync(this.filePath)) {
            const data = fs_1.default.readFileSync(this.filePath, 'utf-8');
            this.guildConfigs = JSON.parse(data);
        }
    }
}
exports.default = ManageGuildVariables;
