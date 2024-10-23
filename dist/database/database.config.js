"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
sqlite3_1.default.verbose();
const dbPath = path_1.default.join(__dirname, './database.db');
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
    else {
        console.log(`Connected at ${dbPath}`);
        db.run('CREATE TABLE IF NOT EXISTS mp_links (id INT PRIMARY KEY UNIQUE, start_time TEXT, name TEXT)', (err) => {
            if (err) {
                console.error(err.message);
            }
            else {
                console.log('Table created or exists');
            }
        });
    }
});
exports.default = db;
