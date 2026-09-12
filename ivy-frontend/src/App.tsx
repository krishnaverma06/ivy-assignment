import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated } from './api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import Projects from './pages/Projects';
import Favorites from './pages/Favorites';
import Rentals from './pages/Rentals';
import ListingDetail from './pages/ListingDetail';
import ProjectDetail from './pages/ProjectDetail';
import RentalDetail from './pages/RentalDetail';

const PrivateRoute = ({ children }: { children: any }) => {
  const [auth, setAuth] = useState(isAuthenticated());

  useEffect(() => {
    const handleAuthExpired = () => setAuth(false);
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/listings" element={<Listings />} />
                      <Route path="/listings/:id" element={<ListingDetail />} />
                      <Route path="/rentals" element={<Rentals />} />
                      <Route path="/rentals/:id" element={<RentalDetail />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/favorites" element={<Favorites />} />
                    </Routes>
                  </main>
                </>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
