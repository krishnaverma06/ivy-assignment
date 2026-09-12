import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await apiFetch(`/v1/projects/${id}`);
        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading details...</div>;
  if (error) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center', color: '#EF4444' }}>{error}</div>;
  if (!project) return null;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>&larr; Back</button>
      
      <div className="card">
        <div className="flex justify-between items-start md:flex-col md:gap-4" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{project.project_status || 'Unknown Status'}</span>
            <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{project.apartment_name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', margin: 0 }}>By {project.developer_name} • {project.locality}</p>
            {project.project_url && (
              <a href={project.project_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                View Builder Site ↗
              </a>
            )}
          </div>
          <div style={{ textAlign: 'right' }} className="md:items-start md:text-left">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>₹{project.price_min} - {project.price_max} Cr</div>
            <div style={{ color: 'var(--text-muted)' }}>{project.min_area_sqft} - {project.max_area_sqft} sqft</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Project Details</h3>
            <div className="flex-col gap-2">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Total Units</span><span>{project.total_units}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Total Towers</span><span>{project.total_towers}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Total Floors</span><span>{project.total_floors}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Launch Date</span><span>{project.launch_date}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Possession</span><span>{project.possession_date}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>RERA</span><span>{project.rera_number || 'N/A'}</span></div>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Available Inventory</h4>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 500 }}>Active Listings</span>
                <span className="badge" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>{project.total_listings} Properties</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Amenities</h3>
            {project.amenities && project.amenities.length > 0 ? (
              <div className="flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                {project.amenities.map((am: string) => (
                  <span key={am} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', backgroundColor: '#E0E7FF', color: 'var(--primary)', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {am}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No amenities listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
