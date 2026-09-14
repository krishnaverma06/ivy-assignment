import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { MapPin, Bed, Maximize } from 'lucide-react';

const Rentals = () => {
  const [allRentals, setAllRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Filters state
  const [locality, setLocality] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRentals = async () => {
      setLoading(true);
      try {
        const cached = localStorage.getItem('cached_rentals');
        if (cached) {
          setAllRentals(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const limit = 50;
        // 1. Initial fast batch (first 300 records)
        const initialPromises = [
          apiFetch(`/v1/rentals?offset=0&limit=${limit}`),
          apiFetch(`/v1/rentals?offset=50&limit=${limit}`),
          apiFetch(`/v1/rentals?offset=100&limit=${limit}`),
          apiFetch(`/v1/rentals?offset=150&limit=${limit}`),
          apiFetch(`/v1/rentals?offset=200&limit=${limit}`),
          apiFetch(`/v1/rentals?offset=250&limit=${limit}`)
        ];
        const initialResults = await Promise.all(initialPromises);
        let accumulated = initialResults
          .flatMap((r: any) => r.results || [])
          .filter((r: any) => r.is_live);

        if (isMounted) {
          setAllRentals(accumulated);
          setLoading(false);
        }

        // 2. Background progressive fetch for remaining records until exhausted
        let offset = 300;
        let hasMore = true;

        while (hasMore && isMounted) {
          const batchPromises = [
            apiFetch(`/v1/rentals?offset=${offset}&limit=${limit}`),
            apiFetch(`/v1/rentals?offset=${offset + 50}&limit=${limit}`),
            apiFetch(`/v1/rentals?offset=${offset + 100}&limit=${limit}`),
            apiFetch(`/v1/rentals?offset=${offset + 150}&limit=${limit}`)
          ];
          const batchResults = await Promise.all(batchPromises);

          let newItems: any[] = [];
          for (const res of batchResults) {
            if (res.results && res.results.length > 0) {
              newItems.push(...res.results.filter((r: any) => r.is_live));
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
              setAllRentals(accumulated);
            }
          }

          offset += 200;
          if (offset > 2000) break; // Guard against infinite loop
        }
        
        if (isMounted && !hasMore) {
          localStorage.setItem('cached_rentals', JSON.stringify(accumulated));
        }
      } catch (err) {
        console.error("Rentals fetch error:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadRentals();
    return () => { isMounted = false; };
  }, []);

  const filteredRentals = useMemo(() => {
    return allRentals.filter(r => {
      if (locality && r.locality?.toLowerCase() !== locality.toLowerCase()) return false;
      if (bedrooms && (bedrooms === '4' ? Number(r.bedroom) >= 4 : r.bedroom?.toString() === bedrooms)) return false;
      if (furnishing && r.furnishing?.toLowerCase() !== furnishing.toLowerCase()) return false;
      if (priceRange) {
        const p = Number(r.price);
        if (priceRange === 'under25' && p >= 25000) return false;
        if (priceRange === '25to50' && (p < 25000 || p >= 50000)) return false;
        if (priceRange === '50to100' && (p < 50000 || p >= 100000)) return false;
        if (priceRange === 'over100' && p < 100000) return false;
      }
      return true;
    });
  }, [allRentals, locality, bedrooms, furnishing, priceRange]);

  const itemsPerPage = 18;
  const paginatedRentals = filteredRentals.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);

  const localities = useMemo(() => {
    return Array.from(new Set(allRentals.map(r => r.locality).filter(Boolean))).sort();
  }, [allRentals]);

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Rental Properties</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Rentals: {filteredRentals.length} / {allRentals.length}
        </span>
      </div>

      {/* Filters Bar */}
      <div className="card flex items-center gap-4 md:flex-col md:items-stretch" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Locality</label>
          <select
            className="form-input"
            value={locality}
            onChange={e => { setLocality(e.target.value); setPage(1); }}
          >
            <option value="">All Localities</option>
            {localities.map((loc: any) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Bedrooms</label>
          <select
            className="form-input"
            value={bedrooms}
            onChange={e => { setBedrooms(e.target.value); setPage(1); }}
          >
            <option value="">Any</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4+ BHK</option>
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Monthly Rent</label>
          <select
            className="form-input"
            value={priceRange}
            onChange={e => { setPriceRange(e.target.value); setPage(1); }}
          >
            <option value="">Any</option>
            <option value="under25">Under ₹25,000</option>
            <option value="25to50">₹25,000 - ₹50,000</option>
            <option value="50to100">₹50,000 - ₹1,00,000</option>
            <option value="over100">Above ₹1,00,000</option>
          </select>
        </div>

        <div className="flex-col gap-2" style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Furnishing</label>
          <select
            className="form-input"
            value={furnishing}
            onChange={e => { setFurnishing(e.target.value); setPage(1); }}
          >
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="fully-furnished">Fully-Furnished</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading rentals...</div>
      ) : filteredRentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No rentals match your filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-1" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
            {paginatedRentals.map(rental => (
              <div
                key={rental.listing_id}
                className="card card-hover flex-col"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderColor: 'var(--border)'
                }}
                onClick={() => navigate(`/rentals/${rental.listing_id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 flex-wrap">
                    <span className="badge" style={{ backgroundColor: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                      {rental.property_type || 'Apartment'}
                    </span>
                    {rental.furnishing && (
                      <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4338CA', textTransform: 'capitalize' }}>
                        {rental.furnishing}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {rental.apartment_name || 'Unknown Building'}
                  </h3>
                  <p className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    <MapPin size={14} /> {rental.locality}
                  </p>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bedrooms</span>
                    <span className="flex items-center gap-1" style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      <Bed size={14} /> {rental.bedroom} BHK
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carpet Area</span>
                    <span className="flex items-center gap-1" style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      <Maximize size={14} /> {rental.carpet_area} sqft
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Monthly Rent</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.5rem', lineHeight: 1 }}>
                      ₹{Number(rental.price)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
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

export default Rentals;
