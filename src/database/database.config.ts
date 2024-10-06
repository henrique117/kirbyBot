import sqlite3 from 'sqlite3'
import path from 'path'

sqlite3.verbose()

const dbPath = path.join(__dirname, './database.db')

const db = new sqlite3.Database(dbPath, (err) => {
    if(err) {
        console.error(err.message)
    } else {
        console.log(`Connected at ${dbPath}`)
        db.run('CREATE TABLE IF NOT EXISTS mp_links (id INT PRIMARY KEY UNIQUE, start_time TEXT, name TEXT)', (err) => {
            if(err) {
                console.error(err.message)
            } else {
                console.log('Table created or exists')
            }
        })
    }
})

export default db