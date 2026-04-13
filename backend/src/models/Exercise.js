const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exercise = sequelize.define('Exercise', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  muscleGroup: { type: DataTypes.STRING, allowNull: false },
  equipment: { type: DataTypes.STRING, allowNull: true },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = Exercise;
