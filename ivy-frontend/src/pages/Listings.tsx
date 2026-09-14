import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, userEmail, getSavedListings, saveListing, removeSavedListing } from '../api';
import { Heart, MapPin, Bed, Maximize } from 'lucide-react';
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
    let isMounted = true;

    const loadListings = async () => {
      setLoading(true);
      try {
        const cached = localStorage.getItem('cached_listings');
        if (cached) {
          setAllListings(JSON.parse(cached));
          setLoading(false);
          // Still need to sync favorites quietly in background
          try {
            const savedData = await getSavedListings();
            if (savedData && savedData.results && isMounted) {
              const serverIds = savedData.results.map((l: any) => l.listing_id);
              setFavorites(serverIds);
              localStorage.setItem(favKey, JSON.stringify(serverIds));
            }
          } catch (e) {
            // ignore error
          }
          return;
        }

        const limit = 50;
        // 1. Initial fast batch (first 300 records)
        const initialPromises = [
          apiFetch(`/v1/listings?offset=0&limit=${limit}`),
          apiFetch(`/v1/listings?offset=50&limit=${limit}`),
          apiFetch(`/v1/listings?offset=100&limit=${limit}`),
          apiFetch(`/v1/listings?offset=150&limit=${limit}`),
          apiFetch(`/v1/listings?offset=200&limit=${limit}`),
          apiFetch(`/v1/listings?offset=250&limit=${limit}`)
        ];
        const initialResults = await Promise.all(initialPromises);
        let accumulated = initialResults
          .flatMap((r: any) => r.results || [])
          .filter((l: any) => l.is_live);

        if (isMounted) {
          setAllListings(accumulated);
          setLoading(false);
        }

        // Sync favorites in the background
        try {
          const savedData = await getSavedListings();
          if (savedData && savedData.results && isMounted) {
            const serverIds = savedData.results.map((l: any) => l.listing_id);
            setFavorites(serverIds);
            localStorage.setItem(favKey, JSON.stringify(serverIds));
          }
        } catch (e) {
          // ignore error and rely on local cache
        }

        // 2. Background progressive fetch for remaining records until exhausted
        let offset = 300;
        let hasMore = true;

        while (hasMore && isMounted) {
          const batchPromises = [
            apiFetch(`/v1/listings?offset=${offset}&limit=${limit}`),
            apiFetch(`/v1/listings?offset=${offset + 50}&limit=${limit}`),
            apiFetch(`/v1/listings?offset=${offset + 100}&limit=${limit}`),
            apiFetch(`/v1/listings?offset=${offset + 150}&limit=${limit}`)
          ];
          const batchResults = await Promise.all(batchPromises);

          let newItems: any[] = [];
          for (const res of batchResults) {
            if (res.results && res.results.length > 0) {
              newItems.push(...res.results.filter((l: any) => l.is_live));
            }
            if (!res.has_more || res.results.length < limit) {
              hasMore = false;
              break;
            }
          }

          if (!isMounted) break;

          if (newItems.length > 0) {
            const existingIds = new Set(accumulated.map(a => a.listing_id));
            const uniqueNew = newItems.filter(item => !existingIds.has(item.listing_id));
            if (uniqueNew.length > 0) {
              accumulated = [...accumulated, ...uniqueNew];
              setAllListings(accumulated);
            }
          }

          offset += 200;
          if (offset > 4000) break; // Guard against infinite loop (total is ~3500)
        }
        
        if (isMounted && !hasMore) {
          localStorage.setItem('cached_listings', JSON.stringify(accumulated));
        }
      } catch (err) {
        console.error("Listings fetch error:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadListings();
    return () => { isMounted = false; };
  }, [favKey]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent navigation
    const isCurrentlyFav = favorites.includes(id);
    const newFavs = isCurrentlyFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem(favKey, JSON.stringify(newFavs));

    try {
      if (isCurrentlyFav) {
        await removeSavedListing(id);
      } else {
        await saveListing(id);
      }
    } catch (err) {
      console.error("Failed to sync favorite on backend", err);
    }
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
        <div className="flex items-center gap-4">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Listings: {filteredListings.length} / {allListings.length}
          </span>
          <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={filterFlagged}
              onChange={e => { setFilterFlagged(e.target.checked); setPage(1); }}
            />
            <span>Filter Corrupt &amp; Fake Listings</span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-4 md:flex-col md:items-stretch" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Locality</label>
          <select className="form-input" value={locality} onChange={e => { setLocality(e.target.value); setPage(1); }}>
            <option value="">All Localities</option>
            {Array.from(new Set(allListings.map(l => l.locality).filter(Boolean))).map((loc: any) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Bedrooms</label>
          <select className="form-input" value={bedrooms} onChange={e => { setBedrooms(e.target.value); setPage(1); }}>
            <option value="">Any</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4+ BHK</option>
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Price Range</label>
          <select className="form-input" value={priceRange} onChange={e => { setPriceRange(e.target.value); setPage(1); }}>
            <option value="">Any</option>
            <option value="under50">Under 50 Lacs</option>
            <option value="50to100">50 - 100 Lacs</option>
            <option value="100to200">1 - 2 Cr</option>
            <option value="over200">Above 2 Cr</option>
          </select>
        </div>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Furnishing</label>
          <select className="form-input" value={furnishing} onChange={e => { setFurnishing(e.target.value); setPage(1); }}>
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
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <p>No listings match your filters.</p>
        </div>
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
                  className="card card-hover flex-col"
                  style={{
                    cursor: 'pointer',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    borderColor: corrupt ? '#FCA5A5' : fake ? '#FCD34D' : 'var(--border)'
                  }}
                  onClick={() => navigate(`/listings/${listing.listing_id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 flex-wrap">
                      <span className="badge" style={{ backgroundColor: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                        {listing.property_type || 'Apartment'}
                      </span>
                      {corrupt && <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Corrupt</span>}
                      {fake && <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Fake</span>}
                      {carpetInfo.isSqm && <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}>sqm</span>}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, listing.listing_id)}
                      className="favorite-btn"
                      style={{ background: 'var(--background)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border)' }}
                    >
                      <Heart size={16} fill={favorites.includes(listing.listing_id) ? '#EF4444' : 'none'} color={favorites.includes(listing.listing_id) ? '#EF4444' : '#6B7280'} />
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

                  <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Listing Price</span>
                      <span style={{ fontWeight: 700, color: corrupt && Number(listing.price) < 0 ? '#DC2626' : 'var(--primary)', fontSize: '1.5rem', lineHeight: 1 }}>
                        ₹{Number(listing.price)?.toLocaleString()}
                      </span>
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
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Previous
              </button>
              <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
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

export default Listings;
