const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/comments', require('./routes/comments'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

sequelize.sync({ alter: true }).then(async () => {
  const { User, Exercise } = require('./models');

  // Seed admin user if none exists
  const adminExists = await User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@gym.com', password: 'admin123', role: 'admin' });
    await User.create({ name: 'Entrenador Demo', email: 'trainer@gym.com', password: 'trainer123', role: 'trainer' });
    await User.create({ name: 'Usuario Demo', email: 'user@gym.com', password: 'user123', role: 'user', trainerId: 2 });
    console.log('Usuarios demo creados');
  }

  // Seed exercises if none exist
  const exerciseCount = await Exercise.count();
  if (exerciseCount === 0) {
    const exercises = [
      { name: 'Press de Banca', description: 'Acostado en banco plano, bajar barra al pecho y empujar', muscleGroup: 'Pecho', equipment: 'Barra y banco', imageUrl: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400', videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg' },
      { name: 'Press Inclinado', description: 'Press en banco inclinado a 30-45 grados', muscleGroup: 'Pecho', equipment: 'Mancuernas y banco', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8' },
      { name: 'Aperturas con Mancuernas', description: 'Abrir brazos con mancuernas en banco plano', muscleGroup: 'Pecho', equipment: 'Mancuernas', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', videoUrl: 'https://www.youtube.com/embed/eozdVDA78K0' },
      { name: 'Sentadilla', description: 'Flexionar rodillas con barra en espalda', muscleGroup: 'Piernas', equipment: 'Barra', imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400', videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8' },
      { name: 'Prensa de Piernas', description: 'Empujar plataforma con las piernas', muscleGroup: 'Piernas', equipment: 'Máquina prensa', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400', videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ' },
      { name: 'Extensión de Cuádriceps', description: 'Extensión de piernas en máquina', muscleGroup: 'Piernas', equipment: 'Máquina', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', videoUrl: 'https://www.youtube.com/embed/YyvSfVjQeL0' },
      { name: 'Curl Femoral', description: 'Flexión de piernas acostado en máquina', muscleGroup: 'Piernas', equipment: 'Máquina', imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400', videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs' },
      { name: 'Peso Muerto', description: 'Levantar barra del suelo con espalda recta', muscleGroup: 'Espalda', equipment: 'Barra', imageUrl: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400', videoUrl: 'https://www.youtube.com/embed/op9kVnSso6Q' },
      { name: 'Dominadas', description: 'Colgarse de barra y subir el cuerpo', muscleGroup: 'Espalda', equipment: 'Barra fija', imageUrl: 'https://images.unsplash.com/photo-1598971639058-a4794ab2fc52?w=400', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g' },
      { name: 'Remo con Barra', description: 'Inclinar torso y tirar barra hacia el abdomen', muscleGroup: 'Espalda', equipment: 'Barra', imageUrl: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400', videoUrl: 'https://www.youtube.com/embed/FWJR5Ve8bnQ' },
      { name: 'Jalón al Pecho', description: 'Tirar polea hacia el pecho sentado', muscleGroup: 'Espalda', equipment: 'Polea', imageUrl: 'https://images.unsplash.com/photo-1598971639058-a4794ab2fc52?w=400', videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc' },
      { name: 'Press Militar', description: 'Empujar barra por encima de la cabeza', muscleGroup: 'Hombros', equipment: 'Barra', imageUrl: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', videoUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI' },
      { name: 'Elevaciones Laterales', description: 'Subir mancuernas a los lados hasta la altura de hombros', muscleGroup: 'Hombros', equipment: 'Mancuernas', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
      { name: 'Curl de Bíceps', description: 'Flexionar codos con barra o mancuernas', muscleGroup: 'Bíceps', equipment: 'Barra o mancuernas', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo' },
      { name: 'Curl Martillo', description: 'Curl con agarre neutro', muscleGroup: 'Bíceps', equipment: 'Mancuernas', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4' },
      { name: 'Extensión de Tríceps', description: 'Extensión por encima de la cabeza con mancuerna', muscleGroup: 'Tríceps', equipment: 'Mancuerna', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', videoUrl: 'https://www.youtube.com/embed/nRiJVZDpdL0' },
      { name: 'Fondos en Paralelas', description: 'Bajar y subir el cuerpo en barras paralelas', muscleGroup: 'Tríceps', equipment: 'Barras paralelas', imageUrl: 'https://images.unsplash.com/photo-1598971639058-a4794ab2fc52?w=400', videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As' },
      { name: 'Crunch Abdominal', description: 'Flexión de tronco acostado en el suelo', muscleGroup: 'Abdominales', equipment: 'Ninguno', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', videoUrl: 'https://www.youtube.com/embed/Xyd_fa5zoEU' },
      { name: 'Plancha', description: 'Mantener posición de plancha isométrica', muscleGroup: 'Abdominales', equipment: 'Ninguno', imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400', videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
      { name: 'Elevación de Pantorrillas', description: 'Subir y bajar en puntas de pie', muscleGroup: 'Pantorrillas', equipment: 'Máquina o escalón', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400', videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc' },
    ];
    await Exercise.bulkCreate(exercises);
    console.log('Ejercicios de ejemplo creados');
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
