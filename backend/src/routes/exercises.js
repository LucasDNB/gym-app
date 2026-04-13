const router = require('express').Router();
const { Exercise } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { Op } = require('sequelize');

router.get('/', authenticate, async (req, res) => {
  try {
    const { search, muscleGroup } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (muscleGroup) where.muscleGroup = muscleGroup;
    const exercises = await Exercise.findAll({ where, order: [['muscleGroup', 'ASC'], ['name', 'ASC']] });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/muscle-groups', authenticate, async (req, res) => {
  try {
    const exercises = await Exercise.findAll({ attributes: ['muscleGroup'], group: ['muscleGroup'] });
    res.json(exercises.map(e => e.muscleGroup));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('admin', 'trainer'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, muscleGroup, equipment, videoUrl } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || null;
    const exercise = await Exercise.create({ name, description, muscleGroup, equipment, imageUrl, videoUrl, createdBy: req.user.id });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'trainer'), upload.single('image'), async (req, res) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });
    const { name, description, muscleGroup, equipment, videoUrl } = req.body;
    if (req.file) exercise.imageUrl = `/uploads/${req.file.filename}`;
    else if (req.body.imageUrl) exercise.imageUrl = req.body.imageUrl;
    Object.assign(exercise, { name: name || exercise.name, description, muscleGroup: muscleGroup || exercise.muscleGroup, equipment, videoUrl });
    await exercise.save();
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });
    await exercise.destroy();
    res.json({ message: 'Ejercicio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
