import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const Rentals = () => {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRentals = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const data = await apiFetch(`/v1/rentals?offset=${offset}&limit=${limit}`);
        setRentals(data.results.filter((r: any) => r.is_live));
        setHasMore(data.results.length === limit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, [page]);

  return (
    <div className="container">
      <h2 style={{ marginBottom: '2rem' }}>Rental Properties</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading rentals...</div>
      ) : rentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No rentals available on this page.</div>
      ) : (
        <>
          <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
            {rentals.map(rental => (
              <div 
                key={rental.listing_id} 
                className="card flex-col gap-2"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/rentals/${rental.listing_id}`)}
              >
                <span className="badge badge-green" style={{ alignSelf: 'flex-start' }}>{rental.property_type || 'Apartment'}</span>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem' }}>{rental.apartment_name || 'Unknown Building'}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{rental.locality}</p>
                
                <div className="flex justify-between items-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rent/Month</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(rental.price)?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Details</span>
                    <span style={{ fontWeight: 500 }}>{rental.bedroom}BHK • {rental.carpet_area} sqft</span>
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

export default Rentals;
