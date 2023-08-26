var mysql = require('mysql');
require('dotenv').config();

var conn = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'test',
    dateStrings:'date'
});

conn.connect();



module.exports = conn;