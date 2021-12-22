const mysql = require('promise-mysql');

//const dbConfig = {
//    connectionLimit: 10,
//    socketPath: "/cloudsql/sturdy-spark-271023:us-central1:mytestdb",
//    user: "Haifeng",
//    password: "Haifeng1",
//    database: "dnacp1"
//};

const dbConfig = {
    host: "localhost",
    user: "Haifeng",
    password: "Haifeng1",
    database: "dnacp1",
    connectionLimit: 10
}

module.exports = async () => {
    try {
        let pool;
        let con;
        if (pool) con = pool.getConnection();
        else {
            pool = await mysql.createPool(dbConfig);
            con = pool.getConnection();
        }
        console.log("DB Connected!");
        return con;
    } catch (ex) {
        throw ex;
    }
}


