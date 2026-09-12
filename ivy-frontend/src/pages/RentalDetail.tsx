import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const RentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRental = async () => {
      try {
        const data = await apiFetch(`/v1/rentals/${id}`);
        setRental(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load rental');
      } finally {
        setLoading(false);
      }
    };
    fetchRental();
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading details...</div>;
  if (error) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center', color: '#EF4444' }}>{error}</div>;
  if (!rental) return null;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>&larr; Back</button>
      
      <div className="card">
        <div className="flex justify-between items-start md:flex-col md:gap-4" style={{ marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>{rental.property_type || 'Rental Property'}</span>
            <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{rental.title || rental.apartment_name || 'Unknown Building'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>{rental.apartment_name} • {rental.locality}</p>
            {rental.listing_url && (
              <a href={rental.listing_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                View Original Listing ↗
              </a>
            )}
          </div>
          <div style={{ textAlign: 'right' }} className="md:items-start md:text-left">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(rental.price)?.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ mo</span></div>
            <div style={{ color: 'var(--text-muted)' }}>{rental.bedroom} BHK • {rental.carpet_area} sqft</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Rental Information</h3>
            <div className="flex-col gap-2">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Security Deposit</span><span style={{ fontWeight: 500 }}>₹{Number(rental.deposit)?.toLocaleString() || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Maintenance</span><span>₹{Number(rental.maintenance)?.toLocaleString() || '0'} / mo</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Furnishing</span><span style={{ textTransform: 'capitalize' }}>{rental.furnishing || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Bathrooms</span><span>{rental.bathroom || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Floor</span><span>{rental.floor} of {rental.total_floors}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Facing</span><span style={{ textTransform: 'capitalize' }}>{rental.facing_direction || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Super Built-up Area</span><span>{rental.super_builtup_area} sqft</span></div>
            </div>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Description</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--text-main)' }}>{rental.description || 'No description provided by the poster.'}</p>
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Contact Poster</h4>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 500 }}>{rental.posted_by_name}</span>
                <span style={{ color: 'var(--primary)' }}>{rental.posted_by_contact}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Listed as {rental.posted_by}</div>
              {rental.is_verified && (
                <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ Verified Contact
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDetail;
