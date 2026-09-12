import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, userEmail } from '../api';
import { Heart } from 'lucide-react';

const Favorites = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const favKey = `favorites_${userEmail || 'guest'}`;
  const [favorites, setFavorites] = useState<string[]>(JSON.parse(localStorage.getItem(favKey) || '[]'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const limit = 50;
        const promises = [
          apiFetch(`/v1/listings?offset=0&limit=${limit}`),
          apiFetch(`/v1/listings?offset=50&limit=${limit}`),
          apiFetch(`/v1/listings?offset=100&limit=${limit}`),
          apiFetch(`/v1/listings?offset=150&limit=${limit}`),
          apiFetch(`/v1/listings?offset=200&limit=${limit}`)
        ];
        const results = await Promise.all(promises);
        const allData = [...results[0].results, ...results[1].results, ...results[2].results, ...results[3].results, ...results[4].results];
        setListings(allData.filter((l: any) => favorites.includes(l.listing_id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [favorites]);

  const removeFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavs = favorites.filter(f => f !== id);
    setFavorites(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h2>Saved Favorites</h2>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No favorite listings yet. Browse listings and save them!</p>
        </div>
      ) : loading ? (
        <div>Loading favorites...</div>
      ) : (
        <div className="grid grid-cols-3">
          {listings.map(listing => (
            <div 
              key={listing.listing_id} 
              className="card flex-col gap-2"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/listings/${listing.listing_id}`)}
            >
              <div className="flex justify-between items-center">
                <span className="badge badge-blue">{listing.property_type || 'Apartment'}</span>
                <button onClick={(e) => removeFavorite(e, listing.listing_id)} style={{ color: '#EF4444' }}>
                  <Heart size={20} fill="#EF4444" />
                </button>
              </div>
              <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem' }}>{listing.apartment_name || 'Unknown Building'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{listing.locality}</p>
              
              <div className="flex justify-between items-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div className="flex flex-col">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price</span>
                  <span style={{ fontWeight: 600 }}>₹{listing.price?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Details</span>
                  <span style={{ fontWeight: 500 }}>{listing.bedroom}BHK • {listing.carpet_area} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
