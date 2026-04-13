const router = require('express').Router();
const { Comment, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

const userAttrs = ['id', 'name', 'email', 'role'];

router.get('/', authenticate, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { [Op.or]: [{ fromUserId: req.user.id }, { toUserId: req.user.id }] },
      include: [
        { model: User, as: 'fromUser', attributes: userAttrs },
        { model: User, as: 'toUser', attributes: userAttrs },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { message, toUserId, routineId } = req.body;
    const comment = await Comment.create({ message, fromUserId: req.user.id, toUserId, routineId });
    const full = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'fromUser', attributes: userAttrs },
        { model: User, as: 'toUser', attributes: userAttrs },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment || comment.toUserId !== req.user.id) return res.status(404).json({ error: 'Comentario no encontrado' });
    comment.read = true;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
