import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, userEmail } from '../api';
import { Heart } from 'lucide-react';
import { isCorruptListing, isFakeListing, formatCarpetArea } from '../auditData';

const Listings = () => {
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Filters state
  const [locality, setLocality] = useState(queryParams.get('locality') || '');
  const [bedrooms, setBedrooms] = useState(queryParams.get('bedrooms') || '');
  const [furnishing, setFurnishing] = useState(queryParams.get('furnishing') || '');
  const [priceRange, setPriceRange] = useState(queryParams.get('priceRange') || '');
  const [filterFlagged, setFilterFlagged] = useState(false);
  
  const favKey = `favorites_${userEmail || 'guest'}`;
  const [favorites, setFavorites] = useState<string[]>(JSON.parse(localStorage.getItem(favKey) || '[]'));
  
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Fetch a large pool for client-side filtering
        const limit = 50;
        const promises = [
          apiFetch(`/v1/listings?offset=0&limit=${limit}`),
          apiFetch(`/v1/listings?offset=50&limit=${limit}`),
          apiFetch(`/v1/listings?offset=100&limit=${limit}`),
          apiFetch(`/v1/listings?offset=150&limit=${limit}`),
          apiFetch(`/v1/listings?offset=200&limit=${limit}`)
        ];
        const results = await Promise.all(promises);
        const data = [...results[0].results, ...results[1].results, ...results[2].results, ...results[3].results, ...results[4].results];
        setAllListings(data.filter((l: any) => l.is_live));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent navigation
    let newFavs = [...favorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter(f => f !== id);
    } else {
      newFavs.push(id);
    }
    setFavorites(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));
  };

  const filteredListings = useMemo(() => {
    return allListings.filter(l => {
      if (filterFlagged && (isCorruptListing(l.listing_id) || isFakeListing(l.listing_id))) return false;
      if (locality && l.locality?.toLowerCase() !== locality.toLowerCase()) return false;
      if (bedrooms && l.bedroom?.toString() !== bedrooms) return false;
      if (furnishing && l.furnishing !== furnishing) return false;
      if (priceRange) {
        const p = Number(l.price);
        if (priceRange === 'under50' && p >= 5000000) return false;
        if (priceRange === '50to100' && (p < 5000000 || p >= 10000000)) return false;
        if (priceRange === '100to200' && (p < 10000000 || p >= 20000000)) return false;
        if (priceRange === 'over200' && p < 20000000) return false;
      }
      return true;
    });
  }, [allListings, locality, bedrooms, furnishing, priceRange, filterFlagged]);

  const itemsPerPage = 20;
  const paginatedListings = filteredListings.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Property Listings</h2>
        <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <input 
            type="checkbox" 
            checked={filterFlagged} 
            onChange={e => { setFilterFlagged(e.target.checked); setPage(1); }} 
          />
          <span>Filter Corrupt &amp; Fake Listings</span>
        </label>
      </div>
      
      {/* Filters */}
      <div className="card flex items-center gap-4 md:flex-col md:items-stretch" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Locality</label>
          <select className="form-input" value={locality} onChange={e => {setLocality(e.target.value); setPage(1);}}>
            <option value="">All Localities</option>
            {Array.from(new Set(allListings.map(l => l.locality).filter(Boolean))).map((loc: any) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Bedrooms</label>
          <select className="form-input" value={bedrooms} onChange={e => {setBedrooms(e.target.value); setPage(1);}}>
            <option value="">Any</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4+ BHK</option>
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Price Range</label>
          <select className="form-input" value={priceRange} onChange={e => {setPriceRange(e.target.value); setPage(1);}}>
            <option value="">Any</option>
            <option value="under50">Under 50 Lacs</option>
            <option value="50to100">50 - 100 Lacs</option>
            <option value="100to200">1 - 2 Cr</option>
            <option value="over200">Above 2 Cr</option>
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Furnishing</label>
          <select className="form-input" value={furnishing} onChange={e => {setFurnishing(e.target.value); setPage(1);}}>
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="fully-furnished">Fully-Furnished</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No listings match your filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-1" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
            {paginatedListings.map(listing => {
              const corrupt = isCorruptListing(listing.listing_id);
              const fake = isFakeListing(listing.listing_id);
              const carpetInfo = formatCarpetArea(listing.carpet_area, listing.listing_id);

              return (
                <div 
                  key={listing.listing_id} 
                  className="card flex-col gap-2" 
                  style={{ 
                    cursor: 'pointer',
                    borderColor: corrupt ? '#FCA5A5' : fake ? '#FCD34D' : 'var(--border)'
                  }}
                  onClick={() => navigate(`/listings/${listing.listing_id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">{listing.property_type || 'Apartment'}</span>
                      {corrupt && (
                        <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Corrupt (Q4)</span>
                      )}
                      {fake && (
                        <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Fake (Q9)</span>
                      )}
                      {carpetInfo.isSqm && (
                        <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}>sqm</span>
                      )}
                    </div>
                    <button onClick={(e) => toggleFavorite(e, listing.listing_id)} style={{ color: favorites.includes(listing.listing_id) ? '#EF4444' : 'var(--text-muted)' }}>
                      <Heart size={20} fill={favorites.includes(listing.listing_id) ? '#EF4444' : 'none'} />
                    </button>
                  </div>
                  <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem' }}>{listing.apartment_name || 'Unknown Building'}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{listing.locality}</p>
                  
                  <div className="flex justify-between items-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div className="flex flex-col">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price</span>
                      <span style={{ fontWeight: 600, color: corrupt && Number(listing.price) < 0 ? '#DC2626' : 'inherit' }}>
                        ₹{Number(listing.price)?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Details</span>
                      <span style={{ fontWeight: 500 }}>{listing.bedroom}BHK • {carpetInfo.display}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4" style={{ paddingBottom: '3rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary" 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
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

export default Listings;
