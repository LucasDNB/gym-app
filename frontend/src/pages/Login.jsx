import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-brand-cream-dark">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Profe Maca" className="h-36 mx-auto mb-4" />
          <p className="text-brand-green-500 mt-1">Inicia sesion en tu cuenta</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-green-600 mb-1">Contrasena</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 border border-brand-cream-dark rounded-lg focus:ring-2 focus:ring-brand-green-500 focus:border-transparent outline-none" placeholder="********" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-pink-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-pink-600 disabled:opacity-50 transition-colors">
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-green-500 mt-6">
          No tenes cuenta? <Link to="/register" className="text-brand-pink-500 font-medium hover:underline">Registrate</Link>
        </p>

        <div className="mt-6 p-4 bg-brand-cream rounded-lg">
          <p className="text-xs text-brand-green-600 font-medium mb-2">Cuentas demo:</p>
          <div className="space-y-1 text-xs text-brand-green-500">
            <p><strong>Admin:</strong> admin@gym.com / admin123</p>
            <p><strong>Entrenador:</strong> trainer@gym.com / trainer123</p>
            <p><strong>Usuario:</strong> user@gym.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
