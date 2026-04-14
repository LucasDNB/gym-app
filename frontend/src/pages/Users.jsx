import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const [usersRes, trainersRes] = await Promise.all([
      api.get('/auth/users'),
      api.get('/auth/users?role=trainer'),
    ]);
    setUsers(usersRes.data);
    setTrainers(trainersRes.data);
  };

  const assignTrainer = async (userId, trainerId) => {
    await api.put(`/auth/users/${userId}/assign-trainer`, { trainerId: trainerId || null });
    loadUsers();
  };

  const roleLabels = { admin: 'Admin', trainer: 'Entrenador', user: 'Usuario' };
  const roleColors = { admin: 'bg-brand-pink-50 text-brand-pink-500', trainer: 'bg-brand-green-50 text-brand-green-600', user: 'bg-brand-cream-dark text-brand-green-500' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green-700 mb-6">Usuarios</h1>

      <div className="bg-white rounded-xl shadow-sm border border-brand-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-cream border-b border-brand-cream-dark">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rol</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Entrenador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-cream">
                  <td className="px-6 py-4 text-sm font-medium text-brand-green-700">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === 'user' ? (
                      <select value={u.trainerId || ''} onChange={(e) => assignTrainer(u.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-green-500 outline-none">
                        <option value="">Sin asignar</option>
                        {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    ) : <span className="text-sm text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
