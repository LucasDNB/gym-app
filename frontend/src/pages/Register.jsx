import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-brand-cream-dark">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Profe Maca" className="h-36 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand-green-600">Crear Cuenta</h1>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={set('name')} required
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Contrasena</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6}
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Rol</label>
            <select value={form.role} onChange={set('role')}
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none">
              <option value="user">Usuario</option>
              <option value="trainer">Entrenador</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-pink-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-pink-600 disabled:opacity-50 transition-colors">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-green-500 mt-6">
          Ya tenes cuenta? <Link to="/login" className="text-brand-pink-500 font-medium hover:underline">Iniciar sesion</Link>
        </p>
      </div>
    </div>
  );
}
