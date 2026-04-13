const router = require('express').Router();
const { Routine, RoutineDay, RoutineExercise, Exercise, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const includeAll = {
  include: [{
    model: RoutineDay, as: 'days', order: [['dayOrder', 'ASC']],
    include: [{
      model: RoutineExercise, as: 'exercises', order: [['order', 'ASC']],
      include: [{ model: Exercise, as: 'exercise' }],
    }],
  }, { model: User, as: 'creator', attributes: ['id', 'name'] },
     { model: User, as: 'assignee', attributes: ['id', 'name'] }],
};

// Get routines (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'user') {
      where.assignedTo = req.user.id;
    } else if (req.user.role === 'trainer') {
      const { Op } = require('sequelize');
      where = { [Op.or]: [{ createdBy: req.user.id }, { isTemplate: true }] };
    }
    const routines = await Routine.findAll({ where, ...includeAll, order: [['createdAt', 'DESC']] });
    res.json(routines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get templates
router.get('/templates', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const routines = await Routine.findAll({ where: { isTemplate: true }, ...includeAll });
    res.json(routines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single routine
router.get('/:id', authenticate, async (req, res) => {
  try {
    const routine = await Routine.findByPk(req.params.id, includeAll);
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });
    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create routine
router.post('/', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const { name, description, isTemplate, assignedTo, days } = req.body;
    const routine = await Routine.create({ name, description, isTemplate: isTemplate || false, createdBy: req.user.id, assignedTo });

    if (days && days.length > 0) {
      for (const day of days) {
        const routineDay = await RoutineDay.create({ dayName: day.dayName, dayOrder: day.dayOrder, routineId: routine.id });
        if (day.exercises && day.exercises.length > 0) {
          for (const ex of day.exercises) {
            await RoutineExercise.create({ routineDayId: routineDay.id, exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, order: ex.order, notes: ex.notes });
          }
        }
      }
    }

    const full = await Routine.findByPk(routine.id, includeAll);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clone template to user
router.post('/:id/assign', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const template = await Routine.findByPk(req.params.id, includeAll);
    if (!template) return res.status(404).json({ error: 'Rutina no encontrada' });

    const { assignedTo, name } = req.body;
    const routine = await Routine.create({ name: name || template.name, description: template.description, isTemplate: false, createdBy: req.user.id, assignedTo });

    for (const day of template.days) {
      const newDay = await RoutineDay.create({ dayName: day.dayName, dayOrder: day.dayOrder, routineId: routine.id });
      for (const ex of day.exercises) {
        await RoutineExercise.create({ routineDayId: newDay.id, exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, order: ex.order, notes: ex.notes });
      }
    }

    const full = await Routine.findByPk(routine.id, includeAll);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update routine
router.put('/:id', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const routine = await Routine.findByPk(req.params.id);
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    const { name, description, isTemplate, assignedTo, days } = req.body;
    await routine.update({ name, description, isTemplate, assignedTo });

    if (days) {
      await RoutineDay.destroy({ where: { routineId: routine.id } });
      for (const day of days) {
        const routineDay = await RoutineDay.create({ dayName: day.dayName, dayOrder: day.dayOrder, routineId: routine.id });
        if (day.exercises && day.exercises.length > 0) {
          for (const ex of day.exercises) {
            await RoutineExercise.create({ routineDayId: routineDay.id, exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, order: ex.order, notes: ex.notes });
          }
        }
      }
    }

    const full = await Routine.findByPk(routine.id, includeAll);
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User updates their weight for an exercise
router.patch('/exercise/:id/weight', authenticate, async (req, res) => {
  try {
    const routineExercise = await RoutineExercise.findByPk(req.params.id, {
      include: [{ model: RoutineDay, include: [{ model: Routine }] }],
    });
    if (!routineExercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });
    if (routineExercise.RoutineDay.Routine.assignedTo !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    routineExercise.userWeight = req.body.userWeight;
    await routineExercise.save();
    res.json(routineExercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete routine
router.delete('/:id', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const routine = await Routine.findByPk(req.params.id);
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });
    await RoutineDay.destroy({ where: { routineId: routine.id } });
    await routine.destroy();
    res.json({ message: 'Rutina eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
