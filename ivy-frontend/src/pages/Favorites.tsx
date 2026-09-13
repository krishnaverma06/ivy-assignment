import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedListings, removeSavedListing, userEmail } from '../api';
import { Heart, MapPin, Bed, Maximize } from 'lucide-react';
import { formatCarpetArea } from '../auditData';

const Favorites = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const favKey = `favorites_${userEmail || 'guest'}`;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        // Fetch saved listings directly from backend /v1/saved
        const data = await getSavedListings();
        if (data && data.results) {
          setListings(data.results);
          // Sync IDs to localStorage for client-side badge/heart consistency
          const ids = data.results.map((l: any) => l.listing_id);
          localStorage.setItem(favKey, JSON.stringify(ids));
        }
      } catch (err) {
        console.error('Failed to fetch from /v1/saved, checking localStorage fallback', err);
        // Fallback: if offline, check cached IDs
        const cachedIds = JSON.parse(localStorage.getItem(favKey) || '[]');
        if (cachedIds.length === 0) {
          setListings([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [favKey]);

  const removeFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Optimistic UI update
    setListings(prev => prev.filter(l => l.listing_id !== id));
    const cachedIds = JSON.parse(localStorage.getItem(favKey) || '[]');
    const newFavs = cachedIds.filter((f: string) => f !== id);
    localStorage.setItem(favKey, JSON.stringify(newFavs));

    try {
      // Sync delete with backend /v1/saved/{id}
      await removeSavedListing(id);
    } catch (err) {
      console.error('Failed to remove saved listing on backend', err);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h2>Saved Favorites</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading saved properties from server...
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No favorite listings yet. Browse listings and save them!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {listings.map(listing => {
            const carpetInfo = formatCarpetArea(listing.carpet_area, listing.listing_id);
            return (
              <div
                key={listing.listing_id}
                className="card card-hover flex-col"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderColor: 'var(--border)'
                }}
                onClick={() => navigate(`/listings/${listing.listing_id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 flex-wrap">
                    <span className="badge" style={{ backgroundColor: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                      {listing.property_type || 'Apartment'}
                    </span>
                    <span className="badge" style={{ backgroundColor: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                      {listing.furnishing_status || 'Unfurnished'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => removeFavorite(e, listing.listing_id)} 
                    className="favorite-btn"
                    style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '50%', color: '#EF4444', border: '1px solid #FCA5A5' }}
                  >
                    <Heart size={16} fill="#EF4444" />
                  </button>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {listing.apartment_name || 'Unknown Building'}
                  </h3>
                  <p className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    <MapPin size={14} /> {listing.locality}
                  </p>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bedrooms</span>
                    <span className="flex items-center gap-1" style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      <Bed size={14} /> {listing.bedroom} BHK
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carpet Area</span>
                    <span className="flex items-center gap-1" style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      <Maximize size={14} /> {carpetInfo.display}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Price</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.5rem', lineHeight: 1 }}>
                      ₹{Number(listing.price)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
