import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Building, Heart, LogOut } from 'lucide-react';
import { clearTokens } from '../api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className="container flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Home size={20} />
          </div>
          Ivy Homes
        </Link>
        <div className="flex items-center gap-6">
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
                {item.label}
              </Link>
            );
          })}
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
          <button onClick={handleLogout} className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
