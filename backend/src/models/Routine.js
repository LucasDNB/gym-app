const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Routine = sequelize.define('Routine', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isTemplate: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  assignedTo: { type: DataTypes.INTEGER, allowNull: true },
});

const RoutineDay = sequelize.define('RoutineDay', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  dayName: { type: DataTypes.STRING, allowNull: false },
  dayOrder: { type: DataTypes.INTEGER, allowNull: false },
  routineId: { type: DataTypes.INTEGER, allowNull: false },
  wodType: { type: DataTypes.STRING, allowNull: true },
  wodContent: { type: DataTypes.TEXT, allowNull: true },
  wodTimecap: { type: DataTypes.INTEGER, allowNull: true },
  wodRounds: { type: DataTypes.INTEGER, allowNull: true },
});

const RoutineExercise = sequelize.define('RoutineExercise', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  routineDayId: { type: DataTypes.INTEGER, allowNull: false },
  exerciseId: { type: DataTypes.INTEGER, allowNull: false },
  sets: { type: DataTypes.INTEGER, defaultValue: 3 },
  reps: { type: DataTypes.STRING, defaultValue: '12' },
  weight: { type: DataTypes.FLOAT, allowNull: true },
  restSeconds: { type: DataTypes.INTEGER, defaultValue: 60 },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  userWeight: { type: DataTypes.FLOAT, allowNull: true },
});

module.exports = { Routine, RoutineDay, RoutineExercise };
