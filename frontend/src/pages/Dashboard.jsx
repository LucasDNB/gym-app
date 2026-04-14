import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';
import { Dumbbell, ClipboardList, Users, MessageSquare, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exercises: 0, routines: 0, comments: 0, users: 0 });

  useEffect(() => {
    Promise.all([
      user.role !== 'user' ? api.get('/exercises').then(r => r.data.length).catch(() => 0) : Promise.resolve(0),
      api.get('/routines').then(r => r.data.length).catch(() => 0),
      api.get('/comments').then(r => r.data.filter(c => !c.read && c.toUserId === user.id).length).catch(() => 0),
      user.role !== 'user' ? api.get('/auth/users?role=user').then(r => r.data.length).catch(() => 0) : Promise.resolve(0),
    ]).then(([exercises, routines, comments, users]) => {
      setStats({ exercises, routines, comments, users });
    });
  }, [user]);

  // User sees a simplified dashboard
  if (user.role === 'user') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-brand-green-600 mb-6">
          Hola, {user?.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/routines" className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-green-500">Mi Rutina</p>
                <p className="text-3xl font-bold text-brand-green-700 mt-1">{stats.routines}</p>
              </div>
              <ClipboardList className="text-brand-green-500" size={32} />
            </div>
          </Link>
          <Link to="/timer" className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-green-500">Timer</p>
                <p className="text-lg font-bold text-brand-green-700 mt-1">HIIT / Tabata</p>
              </div>
              <Timer className="text-brand-pink-500" size={32} />
            </div>
          </Link>
          <Link to="/comments" className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-green-500">Mensajes</p>
                <p className="text-3xl font-bold text-brand-green-700 mt-1">{stats.comments}</p>
              </div>
              <MessageSquare className="text-brand-pink-500" size={32} />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-6">
          <h2 className="text-lg font-semibold text-brand-green-600 mb-2">Empezar a entrenar</h2>
          <p className="text-brand-green-500 mb-4">Revisa tus rutinas asignadas y registra tus pesos.</p>
          <Link to="/routines" className="inline-block bg-brand-pink-500 text-white px-6 py-2 rounded-lg hover:bg-brand-pink-600 transition-colors">
            Ver Mi Rutina
          </Link>
        </div>
      </div>
    );
  }

  // Admin/Trainer full dashboard
  const cards = [
    { label: 'Ejercicios', value: stats.exercises, icon: Dumbbell, to: '/exercises', color: 'text-brand-green-500' },
    { label: 'Rutinas', value: stats.routines, icon: ClipboardList, to: '/routines', color: 'text-brand-green-500' },
    { label: 'Mensajes sin leer', value: stats.comments, icon: MessageSquare, to: '/comments', color: 'text-brand-pink-500' },
    { label: 'Usuarios', value: stats.users, icon: Users, to: '/users', color: 'text-brand-pink-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green-600 mb-6">
        Bienvenido, <span className="text-brand-pink-500">{user?.role === 'trainer' ? 'Entrenador' : ''} {user?.name}</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-green-500">{label}</p>
                <p className="text-3xl font-bold text-brand-green-700 mt-1">{value}</p>
              </div>
              <Icon className={color} size={32} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
