//db connection details
//import into all router files by using the following line along with library imports at top of the file
//const db = require('../database/db.js');

const mysql = require('mysql2/promise');


const pool = mysql.createPool({
    host: 'proximity-bank-database.cx42gcsw4xhh.us-east-1.rds.amazonaws.com',
    user: 'pbd_db_admin',
    password: 'gurWer-jyhkon-bojgi6',
    database: 'ProximityBank',
});


module.exports = pool;