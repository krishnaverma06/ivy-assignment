import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, userEmail } from '../api';
import { Heart, AlertTriangle, ShieldAlert } from 'lucide-react';
import { isCorruptListing, isFakeListing, formatCarpetArea } from '../auditData';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const favKey = `favorites_${userEmail || 'guest'}`;
  const [favorites, setFavorites] = useState<string[]>(JSON.parse(localStorage.getItem(favKey) || '[]'));
  const isFavorite = id ? favorites.includes(id) : false;

  const isCorrupt = isCorruptListing(id);
  const isFake = isFakeListing(id);

  const toggleFavorite = () => {
    if (!id) return;
    const newFavs = isFavorite ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));
  };

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

  const carpetInfo = formatCarpetArea(listing.carpet_area, listing.listing_id);

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>&larr; Back</button>
      
      {/* Audit Warning Banners */}
      {isCorrupt && (
        <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991B1B' }}>
          <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Data Integrity Alert:</strong> This listing was identified as containing mathematically impossible data (e.g., negative price, floor &gt; total floors, or carpet area &gt; super built-up area).
          </div>
        </div>
      )}

      {isFake && (
        <div className="card" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400E' }}>
          <ShieldAlert size={24} color="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <strong>Syndicate / Fraud Alert:</strong> The seller contact ({listing.posted_by_contact}) was identified posting under multiple conflicting agent/agency names to generate fake inquiries.
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-start md:flex-col md:gap-4" style={{ marginBottom: '1.5rem' }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-blue">{listing.property_type || 'Property'}</span>
              {carpetInfo.isSqm && (
                <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}>MagicHomes (sqm)</span>
              )}
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{listing.apartment_name || 'Unknown Building'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>{listing.locality}</p>
            {listing.listing_url && (
              <a href={listing.listing_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                View Original Listing ↗
              </a>
            )}
          </div>
          <div style={{ textAlign: 'right' }} className="md:items-start md:text-left">
            <button 
              onClick={toggleFavorite} 
              className="btn btn-secondary" 
              style={{ marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Heart size={18} fill={isFavorite ? '#EF4444' : 'none'} color={isFavorite ? '#EF4444' : 'currentColor'} />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(listing.price)?.toLocaleString()}</div>
            <div style={{ color: 'var(--text-muted)' }}>{listing.bedroom} BHK • {carpetInfo.display}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Property Details</h3>
            <div className="flex-col gap-2">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Furnishing</span><span style={{ textTransform: 'capitalize' }}>{listing.furnishing || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Bathrooms</span><span>{listing.bathroom || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Balconies</span><span>{listing.balcony || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Floor</span><span>{listing.floor} of {listing.total_floors}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Facing</span><span style={{ textTransform: 'capitalize' }}>{listing.facing_direction || 'N/A'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Parking</span><span>{listing.covered_parking} Covered</span></div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Carpet Area</span>
                <span>{carpetInfo.display}</span>
              </div>
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
