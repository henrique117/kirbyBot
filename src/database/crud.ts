import db from './database.config'
import * as Interfaces from '../interfaces/interfaces.export'

export function addMatch(id: number, start_time: string, name: string) {
    const sql = 'INSERT INTO mp_links (id, start_time, name) VALUES (?, ?, ?)'
    db.run(sql, [id, start_time, name], (err) => {
        if(err) {
            console.error(err.message)
        }
    })
}

export function getQueryMatches(param_type: string, param_value: string): Promise<Interfaces.MatchesInterfaces[]> {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM mp_links WHERE name LIKE ?'

        if (param_type === '-n' || param_type === '-name') {
            db.all(sql, [`%${param_value}%`], (err: any, rows: Interfaces.MatchesInterfaces[]) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        }
    });
}


export function getLastMatch(callback: Function) {
    const sql = 'SELECT MAX(id) as id FROM mp_links'

    db.all(sql, [], callback)
}

export function getAllShit(callback: Function) {
    const sql = 'SELECT * FROM mp_links'
    db.all(sql, [], callback)
}