const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(process.env.DB_PATH || './database.sqlite'),
  logging: false,
});

module.exports = sequelize;
