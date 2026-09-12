import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await apiFetch(`/v1/listings/${id}`);
        setListing(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading details...</div>;
  if (error) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center', color: '#EF4444' }}>{error}</div>;
  if (!listing) return null;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>&larr; Back</button>
      
      <div className="card">
        <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{listing.property_type || 'Property'}</span>
            <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{listing.apartment_name || 'Unknown Building'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>{listing.locality}</p>
            {listing.listing_url && (
              <a href={listing.listing_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                View Original Listing ↗
              </a>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(listing.price)?.toLocaleString()}</div>
            <div style={{ color: 'var(--text-muted)' }}>{listing.bedroom} BHK • {listing.carpet_area} sqft</div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Property Details</h3>
            <div className="flex-col gap-2">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Furnishing</span><span style={{ textTransform: 'capitalize' }}>{listing.furnishing || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Bathrooms</span><span>{listing.bathroom || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Balconies</span><span>{listing.balcony || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Floor</span><span>{listing.floor} of {listing.total_floors}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Facing</span><span style={{ textTransform: 'capitalize' }}>{listing.facing_direction || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Parking</span><span>{listing.covered_parking} Covered</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Super Built-up Area</span><span>{listing.super_built_up_area} sqft</span></div>
            </div>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Description</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--text-main)' }}>{listing.description || 'No description provided by the seller.'}</p>
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Contact Seller</h4>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 500 }}>{listing.posted_by_name}</span>
                <span style={{ color: 'var(--primary)' }}>{listing.posted_by_contact}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Listed as {listing.posted_by}</div>
              {listing.is_verified && (
                <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ Verified Seller
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Listings Strip */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Similar Listings in {listing.locality}</h3>
          <div className="grid grid-cols-3">
            <div className="card" style={{ padding: '1rem', cursor: 'pointer', opacity: 0.8 }} onClick={() => navigate(`/listings?locality=${encodeURIComponent(listing.locality)}`)}>
               <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>View More</span>
               <h4 style={{ margin: '0 0 0.25rem' }}>Explore {listing.locality}</h4>
               <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Browse all listings in this area to find similar properties.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingDetail;
