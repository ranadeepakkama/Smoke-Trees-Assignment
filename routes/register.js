var express = require('express');
var router = express.Router();
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const { route } = require('.');

const databasePath = path.join(__dirname, 'userData.db');
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    await createTables();
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

const createTables = async () => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS address (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      address VARCHAR(255) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id)
    )
  `);

  console.log('Tables created successfully');
};

initializeDbAndServer();

router.get('/', async (req, res) => {
    res.send('route in register Page');
});

router.post('/', async (req, res) => { 
  try {
    const { name, address } = req.body; 

    const getUserQuery = `SELECT * FROM user WHERE name = ?`;
    const existingUser = await db.get(getUserQuery, [name]);

    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    const insertUserQuery = `INSERT INTO user (name) VALUES (?)`;
    const result = await db.run(insertUserQuery, [name]);
    const userId = result.lastID;

    const insertAddressQuery = `INSERT INTO address (user_id, address) VALUES (?, ?)`;
    await db.run(insertAddressQuery, [userId, address]);

    res.send('New user registered');

  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).send('Internal server error');
  }
});

module.exports = router