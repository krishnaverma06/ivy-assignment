import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const Projects = () => {
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Filters state
  const [locality, setLocality] = useState('');
  const [status, setStatus] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [developer, setDeveloper] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const limit = 50;
        const promises = [
          apiFetch(`/v1/projects?offset=0&limit=${limit}`),
          apiFetch(`/v1/projects?offset=50&limit=${limit}`),
          apiFetch(`/v1/projects?offset=100&limit=${limit}`),
          apiFetch(`/v1/projects?offset=150&limit=${limit}`),
          apiFetch(`/v1/projects?offset=200&limit=${limit}`),
          apiFetch(`/v1/projects?offset=250&limit=${limit}`),
          apiFetch(`/v1/projects?offset=300&limit=${limit}`),
          apiFetch(`/v1/projects?offset=350&limit=${limit}`)
        ];
        const results = await Promise.all(promises);
        const data = results.flatMap((r: any) => r.results || []);
        setAllProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => {
      if (locality && p.locality?.toLowerCase() !== locality.toLowerCase()) return false;
      if (status && p.project_status?.toLowerCase() !== status.toLowerCase()) return false;
      if (developer && p.developer_name?.toLowerCase() !== developer.toLowerCase()) return false;
      if (priceRange) {
        const min = Number(p.price_min);
        const max = Number(p.price_max);
        if (priceRange === 'under1.5' && min >= 1.5) return false;
        if (priceRange === '1.5to3' && (min >= 3 || max < 1.5)) return false;
        if (priceRange === '3to5' && (min >= 5 || max < 3)) return false;
        if (priceRange === 'over5' && max < 5) return false;
      }
      return true;
    });
  }, [allProjects, locality, status, developer, priceRange]);

  const itemsPerPage = 18;
  const paginatedProjects = filteredProjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const localities = useMemo(() => {
    return Array.from(new Set(allProjects.map(p => p.locality).filter(Boolean))).sort();
  }, [allProjects]);

  const developers = useMemo(() => {
    return Array.from(new Set(allProjects.map(p => p.developer_name).filter(Boolean))).sort();
  }, [allProjects]);

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Project Developments</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {filteredProjects.length} projects found
        </span>
      </div>

      {/* Filters Bar */}
      <div className="card flex items-center gap-4 md:flex-col md:items-stretch" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Locality</label>
          <select 
            className="form-input" 
            value={locality} 
            onChange={e => { setLocality(e.target.value); setPage(1); }}
          >
            <option value="">All Localities</option>
            {localities.map((loc: any) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Status</label>
          <select 
            className="form-input" 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Any Status</option>
            <option value="ready to move">Ready to Move</option>
            <option value="under construction">Under Construction</option>
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Price Range</label>
          <select 
            className="form-input" 
            value={priceRange} 
            onChange={e => { setPriceRange(e.target.value); setPage(1); }}
          >
            <option value="">Any Price</option>
            <option value="under1.5">Under ₹1.5 Cr</option>
            <option value="1.5to3">₹1.5 - 3 Cr</option>
            <option value="3to5">₹3 - 5 Cr</option>
            <option value="over5">Above ₹5 Cr</option>
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Developer</label>
          <select 
            className="form-input" 
            value={developer} 
            onChange={e => { setDeveloper(e.target.value); setPage(1); }}
          >
            <option value="">All Developers</option>
            {developers.map((dev: any) => (
              <option key={dev} value={dev}>{dev}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No projects match your filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-1" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
            {paginatedProjects.map(project => (
              <div 
                key={project.project_id} 
                className="card flex-col gap-2" 
                style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                onClick={() => navigate(`/projects/${project.project_id}`)}
              >
                <div className="flex justify-between items-start">
                  <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                    {project.project_status || 'Unknown Status'}
                  </span>
                  {project.total_listings !== undefined && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {project.total_listings} active listings
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem' }}>{project.apartment_name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  By {project.developer_name} • {project.locality}
                </p>
                
                <div className="flex justify-between items-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price Range</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.125rem' }}>
                      ₹{project.price_min} - {project.price_max} Cr
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Area</span>
                    <span style={{ fontWeight: 500 }}>{project.min_area_sqft} - {project.max_area_sqft} sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4" style={{ paddingBottom: '3rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Previous
              </button>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary" 
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Projects;
