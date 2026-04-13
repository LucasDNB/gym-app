const User = require('./User');
const Exercise = require('./Exercise');
const { Routine, RoutineDay, RoutineExercise } = require('./Routine');
const Comment = require('./Comment');

// User associations
User.hasMany(Routine, { foreignKey: 'createdBy', as: 'createdRoutines' });
User.hasMany(Routine, { foreignKey: 'assignedTo', as: 'assignedRoutines' });
Routine.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Routine.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Routine -> Days -> Exercises
Routine.hasMany(RoutineDay, { foreignKey: 'routineId', as: 'days', onDelete: 'CASCADE' });
RoutineDay.belongsTo(Routine, { foreignKey: 'routineId' });

RoutineDay.hasMany(RoutineExercise, { foreignKey: 'routineDayId', as: 'exercises', onDelete: 'CASCADE' });
RoutineExercise.belongsTo(RoutineDay, { foreignKey: 'routineDayId' });
RoutineExercise.belongsTo(Exercise, { foreignKey: 'exerciseId', as: 'exercise' });

// Comments
User.hasMany(Comment, { foreignKey: 'fromUserId', as: 'sentComments' });
User.hasMany(Comment, { foreignKey: 'toUserId', as: 'receivedComments' });
Comment.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
Comment.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });
Comment.belongsTo(Routine, { foreignKey: 'routineId', as: 'routine' });

// Trainer-User relationship
User.belongsTo(User, { foreignKey: 'trainerId', as: 'trainer' });
User.hasMany(User, { foreignKey: 'trainerId', as: 'clients' });

module.exports = { User, Exercise, Routine, RoutineDay, RoutineExercise, Comment };
