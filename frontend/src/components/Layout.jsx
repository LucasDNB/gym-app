import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Users, ClipboardList, MessageSquare, LogOut, Menu, X, Home, Timer } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', label: 'Inicio', icon: Home, roles: ['admin', 'trainer', 'user'] },
    { to: '/exercises', label: 'Ejercicios', icon: Dumbbell, roles: ['admin', 'trainer'] },
    { to: '/routines', label: 'Mi Rutina', icon: ClipboardList, roles: ['user'] },
    { to: '/routines', label: 'Rutinas', icon: ClipboardList, roles: ['admin', 'trainer'] },
    { to: '/timer', label: 'Timer', icon: Timer, roles: ['admin', 'trainer', 'user'] },
    { to: '/comments', label: 'Mensajes', icon: MessageSquare, roles: ['admin', 'trainer', 'user'] },
    { to: '/users', label: 'Usuarios', icon: Users, roles: ['admin', 'trainer'] },
  ];

  const filtered = navItems.filter((item) => item.roles.includes(user?.role));
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Mobile header */}
      <div className="lg:hidden bg-brand-cream border-b border-brand-cream-dark flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Profe Maca" className="h-10" />
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-brand-green-600">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-brand-cream border-r border-brand-cream-dark flex-shrink-0`}>
          <div className="hidden lg:flex items-center justify-center px-6 py-5 border-b border-brand-cream-dark">
            <img src="/logo.png" alt="Profe Maca" className="h-28" />
          </div>
          <div className="px-4 py-3 border-b border-brand-cream-dark">
            <p className="text-sm text-brand-green-500">Hola,</p>
            <p className="font-semibold text-brand-pink-500">{user?.name}</p>
          </div>
          <nav className="mt-4 px-3 space-y-1">
            {filtered.map(({ to, label, icon: Icon }) => (
              <Link key={to + label} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(to) ? 'bg-brand-pink-50 text-brand-pink-500 font-semibold' : 'text-brand-green-600 hover:bg-brand-green-50'}`}>
                <Icon size={20} /> {label}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 w-full px-3 py-4 border-t border-brand-cream-dark">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-green-600 hover:bg-brand-green-50 w-full">
              <LogOut size={20} /> Cerrar sesion
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {menuOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMenuOpen(false)} />}

        {/* Main */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
