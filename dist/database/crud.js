"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMatch = addMatch;
exports.getQueryMatches = getQueryMatches;
exports.getLastMatch = getLastMatch;
exports.getAllShit = getAllShit;
const database_config_1 = __importDefault(require("./database.config"));
function addMatch(id, start_time, name) {
    const sql = 'INSERT INTO mp_links (id, start_time, name) VALUES (?, ?, ?)';
    database_config_1.default.run(sql, [id, start_time, name], (err) => {
        if (err) {
            console.error(err.message);
        }
    });
}
function getQueryMatches(param_type, param_value) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM mp_links WHERE name LIKE ?';
        if (param_type === '-n' || param_type === '-name') {
            database_config_1.default.all(sql, [`%${param_value}%`], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        }
    });
}
function getLastMatch(callback) {
    const sql = 'SELECT MAX(id) as id FROM mp_links';
    database_config_1.default.all(sql, [], callback);
}
function getAllShit(callback) {
    const sql = 'SELECT * FROM mp_links';
    database_config_1.default.all(sql, [], callback);
}
