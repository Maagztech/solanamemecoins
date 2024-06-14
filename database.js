const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'asutosh',
    password: 'asutosh',
    database: 'memecoins',
    charset: 'utf8mb4'
});


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id', connection.threadId);
});

async function dropAndCreateTable() {
    try {
        // await dropTable();
        await createTable();
    } catch (error) {
        console.error('Error dropping or creating table:', error);
        throw error;
    }
}

function dropTable() {
    return new Promise((resolve, reject) => {
        const dropQuery = `DROP TABLE IF EXISTS memecoinsList`;
        connection.query(dropQuery, (err, results) => {
            if (err) {
                console.error('Error dropping table:', err);
                reject(err);
            } else {
                console.log('Table memecoinsList dropped successfully.');
                resolve();
            }
        });
    });
}

function createTable() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS memecoinsList (
                caValue VARCHAR(255) PRIMARY KEY,
                img VARCHAR(255),
                creator VARCHAR(255),
                marketCap VARCHAR(255),
                replies VARCHAR(255),
                description TEXT,
                message TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        connection.query(createTableQuery, (err, results) => {
            if (err) {
                console.error('Error creating table:', err);
                reject(err);
            } else {
                console.log('Table memecoinsList created successfully.');
                resolve();
            }
        });
    });
}

async function insertDataToDB(data) {
    try {
        await dropAndCreateTable();

        const insertQuery = `INSERT INTO memecoinsList (caValue, img, creator, marketCap, replies, description, message) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        for (const item of data) {
            try {
                await insertItem(item, insertQuery);
                console.log(`Inserted data with caValue ${item.caValue} into database.`);
            } catch (error) {
                console.error(`Error processing item with caValue ${item.caValue}:`, error);
            }
        }

        const rowCount = await countRows();
        console.log(`Total coins present: ${rowCount}`);

        return rowCount;
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    }
}

function insertItem(item, query) {
    return new Promise((resolve, reject) => {
        connection.query(query, [item.caValue, item.img, item.creator, item.marketCap, item.replies, item.description, item.message], (err, results) => {
            if (err) {
                console.error('Error inserting item:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function countRows() {
    return new Promise((resolve, reject) => {
        const countQuery = `SELECT COUNT(*) AS totalRows FROM memecoinsList`;
        connection.query(countQuery, (err, results) => {
            if (err) {
                console.error('Error counting rows:', err);
                reject(err);
            } else {
                resolve(results[0].totalRows);
            }
        });
    });
}

module.exports = {
    connection,
    insertDataToDB
};
