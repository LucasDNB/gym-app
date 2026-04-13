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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Hola, {user?.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/routines" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mi Rutina</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.routines}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg"><ClipboardList className="text-white" size={24} /></div>
            </div>
          </Link>
          <Link to="/timer" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Timer</p>
                <p className="text-lg font-bold text-gray-900 mt-1">HIIT / Tabata</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg"><Timer className="text-white" size={24} /></div>
            </div>
          </Link>
          <Link to="/comments" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mensajes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.comments}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg"><MessageSquare className="text-white" size={24} /></div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-2">Empezar a entrenar</h2>
          <p className="text-gray-500 mb-4">Revisá tus rutinas asignadas y registrá tus pesos.</p>
          <Link to="/routines" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Ver Mi Rutina
          </Link>
        </div>
      </div>
    );
  }

  // Admin/Trainer full dashboard
  const cards = [
    { label: 'Ejercicios', value: stats.exercises, icon: Dumbbell, to: '/exercises', color: 'bg-blue-500' },
    { label: 'Rutinas', value: stats.routines, icon: ClipboardList, to: '/routines', color: 'bg-green-500' },
    { label: 'Mensajes sin leer', value: stats.comments, icon: MessageSquare, to: '/comments', color: 'bg-yellow-500' },
    { label: 'Usuarios', value: stats.users, icon: Users, to: '/users', color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bienvenido, {user?.name}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
