import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Building, Heart, LogOut, Sun, Moon } from 'lucide-react';
import { clearTokens } from '../api';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/listings', label: 'Listings', icon: Home },
    { path: '/rentals', label: 'Rentals', icon: Home },
    { path: '/projects', label: 'Projects', icon: Building },
    { path: '/favorites', label: 'Favorites', icon: Heart },
  ];

  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center md:flex-col md:items-start md:gap-4">
        <Link to="/dashboard" className="flex items-center gap-2" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Home size={20} />
          </div>
          Ivy Homes
        </Link>
        <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2"
                style={{ 
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                <Icon size={18} />
                <span className="md:hidden">{item.label}</span>
              </Link>
            );
          })}
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
          
          <button onClick={toggleTheme} className="flex items-center justify-center" style={{ padding: '0.25rem' }}>
            {theme === 'dark' ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="var(--text-muted)" />}
          </button>
          
          <button onClick={handleLogout} className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            <LogOut size={18} />
            <span className="md:hidden">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
