import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { TrendingUp, ShieldAlert, FileX } from 'lucide-react';
import { AUDIT_METRICS } from '../auditData';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Since /v1/analytics/summary is 404, we manually fetch a large sample to compute insights
        const limit = 50;
        const promises = [
          apiFetch(`/v1/listings?offset=0&limit=${limit}`),
          apiFetch(`/v1/listings?offset=50&limit=${limit}`),
          apiFetch(`/v1/listings?offset=100&limit=${limit}`),
          apiFetch(`/v1/listings?offset=150&limit=${limit}`)
        ];

        const results = await Promise.all(promises);
        const allListings = [...results[0].results, ...results[1].results, ...results[2].results, ...results[3].results].filter(l => l.is_live);

        // Compute Median Price from sample
        const prices = allListings.map(l => Number(l.price)).filter(p => p > 0 && !isNaN(p)).sort((a, b) => a - b);
        const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;

        // Compute Median Price Per Sqft from sample
        const pricesPerSqft = allListings
          .filter(l => Number(l.price) > 0 && Number(l.carpet_area) > 0)
          .map(l => Number(l.price) / Number(l.carpet_area))
          .filter(p => !isNaN(p))
          .sort((a, b) => a - b);
        const medianPricePerSqft = pricesPerSqft.length > 0 ? pricesPerSqft[Math.floor(pricesPerSqft.length / 2)] : 0;

        // Compute By Locality
        const localityMap: Record<string, { total: number, count: number }> = {};
        allListings.forEach(l => {
          const p = Number(l.price);
          if (!l.locality || isNaN(p) || p <= 0) return;
          if (!localityMap[l.locality]) localityMap[l.locality] = { total: 0, count: 0 };
          localityMap[l.locality].total += p;
          localityMap[l.locality].count += 1;
        });

        const byLocality = Object.entries(localityMap)
          .map(([name, data]) => ({
            name,
            avg_price: Math.round(data.total / data.count)
          }))
          .sort((a, b) => b.avg_price - a.avg_price)
          .slice(0, 5); // Top 5

        setStats({
          medianPrice,
          medianPricePerSqft,
          byLocality
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Market Analytics & Audit
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
            Gurgaon real estate data synthesised from verified listings. API discrepancies and corrupt records filtered out.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Aggregating data...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Key Market Metrics */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              Verified Market Metrics
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-2" style={{ gap: '1.25rem' }}>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Listings</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  {AUDIT_METRICS.totalListings.toLocaleString()}
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unique Properties</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  {AUDIT_METRICS.uniqueProperties.toLocaleString()}
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active Listings</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  {AUDIT_METRICS.activeListings.toLocaleString()}
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recent Listings (7d)</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  {AUDIT_METRICS.listingsLast7Days.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-1" style={{ gap: '1.25rem', marginTop: '1.25rem' }}>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Monthly Rent</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  ₹{AUDIT_METRICS.totalMonthlyRent.toLocaleString()}
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>2 BHK Avg Price (Sqft)</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  ₹{Math.round(AUDIT_METRICS.avgPricePerSqft2Bhk).toLocaleString()}
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Costliest Project</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0 0' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    ₹{(AUDIT_METRICS.costliestProjectPrice / 10000000).toFixed(1)}Cr
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({AUDIT_METRICS.costliestProjectId})</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Audit & Integrity Section */}
            <section className="card" style={{ padding: '1.75rem', boxShadow: 'none', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                Data Integrity Audit
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="flex items-start gap-4" style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', borderRadius: '0.5rem', color: '#DC2626' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Fraud Rings Detected</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Isolated <strong>{AUDIT_METRICS.fakeCount} fake listings</strong> generated by <strong>{AUDIT_METRICS.fakeAgentsCount} alias accounts</strong> to drive artificial inquiries.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4" style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '0.5rem', color: '#D97706' }}>
                    <FileX size={20} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Corrupt Records Removed</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Purged <strong>{AUDIT_METRICS.corruptCount} listings</strong> with logically impossible values (e.g., negative prices, incorrect area logic).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div style={{ padding: '0.75rem', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', color: '#4B5563' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>API Pagination Undercounts</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Identified <strong>{AUDIT_METRICS.projectMismatches} projects</strong> reporting inaccurate total listing counts due to API pagination bugs.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Localities Section */}
            <section className="card" style={{ padding: '1.75rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                Top Localities by Price
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.byLocality?.map((loc: any, idx: number) => (
                  <div key={loc.name} className="flex justify-between items-center" style={{ paddingBottom: '1rem', borderBottom: idx === 4 ? 'none' : '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)', textTransform: 'capitalize', fontSize: '1rem' }}>
                        {loc.name}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      ₹{(loc.avg_price / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
