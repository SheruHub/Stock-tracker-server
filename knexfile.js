// Update with your config settings.

// module.exports = {
//     client: 'mysql',
//     connection: {
//         host: '127.0.0.1',
//         port: '3307',
//         database: 'webcomputing',
//         user: 'root',
//         password: 'root',
//     }
// };

module.exports = {
    client: process.env.DB_CLIENT,
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    }
}
