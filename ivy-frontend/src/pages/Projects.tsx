import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const data = await apiFetch(`/v1/projects?offset=${offset}&limit=${limit}`);
        setProjects(data.results);
        setHasMore(data.results.length === limit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [page]);

  return (
    <div className="container">
      <h2 style={{ marginBottom: '2rem' }}>Project Details</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No projects available on this page.</div>
      ) : (
        <>
          <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
            {projects.map(project => (
              <div 
                key={project.project_id} 
                className="card flex-col gap-2" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${project.project_id}`)}
              >
                <div className="flex justify-between items-start">
                  <span className="badge badge-blue">{project.project_status || 'Unknown Status'}</span>
                </div>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem' }}>{project.apartment_name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>By {project.developer_name} • {project.locality}</p>
                
                <div className="flex justify-between items-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price Range</span>
                    <span style={{ fontWeight: 600 }}>₹{project.price_min} - {project.price_max} Cr</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Area</span>
                    <span style={{ fontWeight: 500 }}>{project.min_area_sqft} - {project.max_area_sqft} sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4" style={{ paddingBottom: '3rem' }}>
            <button 
              className="btn btn-secondary" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ fontWeight: 500 }}>Page {page}</span>
            <button 
              className="btn btn-secondary" 
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;
