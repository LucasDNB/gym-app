const { Sequelize } = require('sequelize');
require('dotenv').config();

// Accept pg module from caller (Vercel) or require it locally (dev)
const pg = global.__pg || require('pg');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  },
  logging: false,
});

module.exports = sequelize;
