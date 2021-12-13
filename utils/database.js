const mysql = require('mysql');
const config = require('../config/config');

const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    connectionLimit: 100,
    charset: 'utf8'
});

const createConnection = (isTransaction = false) => {
    var _connection;

    const getConnection = () => {
        return new Promise((resolve, reject) => {
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    return reject(connectionError);
                };

                _connection = connection;

                if (isTransaction) {
                    connection.beginTransaction(transactionError => {
                        if (transactionError) {
                            return reject(transactionError);
                        }

                        return resolve(connection);
                    });
                } else {
                    return resolve(connection);
                }
            });
        });
    };

    const end = () => {
        if (_connection) {
            _connection.release();
        }
    };

    const beginTransaction = () => {
        return new Promise((resolve, reject) => {
            if (_connection) {
                _connection.beginTransaction(transactionError => {
                    if (transactionError) {
                        return reject(transactionError);
                    }

                    return resolve(_connection);
                });
            } else {
                return reject('Connection not found');
            }
        });
    };

    const commit = async () => {
        if (_connection) {
            await _connection.commit();
        }
    };

    const rollback = async () => {
        if (_connection) {
            await _connection.rollback();
        }
    };

    const query = (query, options) => {
        return new Promise(async (resolve, reject) => {
            let localQuery = false;

            if (!_connection) {
                localQuery = true;
                _connection = await createConnection(false);
            }

            _connection.query(query, options, (error, rows) => {
                if (localQuery && _connection) {
                    _connection.release();
                }

                if (error) {
                    return reject(error);
                }

                return resolve(rows);
            });
        })
    };

    return getConnection().then(() => {
        return {
            end,
            beginTransaction,
            commit,
            rollback,
            query
        };
    });
}

module.exports = {
    createConnection
};