import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { TrendingUp, ShieldAlert, FileX } from 'lucide-react';
import { AUDIT_METRICS, FINDINGS } from '../auditData';

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
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recent Listings (Pre-Ref 7d)</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  {AUDIT_METRICS.listingsLast7Days.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-1" style={{ gap: '1.25rem', marginTop: '1.25rem' }}>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Monthly Rent (MG Road)</span>
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

            <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '1.25rem', marginTop: '1.25rem' }}>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Rentals</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  1,320
                </div>
              </div>
              <div className="card card-hover" style={{ padding: '1.5rem', boxShadow: 'none', border: '1px solid var(--border)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Projects</span>
                <div style={{ fontSize: '2rem', fontWeight: 600, margin: '0.5rem 0 0', color: 'var(--text-main)' }}>
                  400
                </div>
              </div>
            </div>
          </section>

          {/* Audit & Integrity Section */}
          <section className="card" style={{ padding: '1.75rem', boxShadow: 'none', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              Data Integrity Audit
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-1" style={{ gap: '1.25rem' }}>
              <div className="card card-hover" style={{ padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)' }}>
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem', backgroundColor: '#FEF2F2', borderRadius: '0.5rem', color: '#DC2626' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Fraud Rings Detected</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Isolated <strong>{AUDIT_METRICS.fakeCount} fake listings</strong> generated by <strong>{AUDIT_METRICS.fakeAgentsCount} alias accounts</strong> to drive artificial inquiries.
                  </p>
                </div>
              </div>
              
              <div className="card card-hover" style={{ padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)' }}>
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '0.5rem', color: '#D97706' }}>
                  <FileX size={24} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Corrupt Records Removed</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Purged <strong>{AUDIT_METRICS.corruptCount} listings</strong> with logically impossible values (e.g., negative prices, incorrect area logic).
                  </p>
                </div>
              </div>

              <div className="card card-hover" style={{ padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)' }}>
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', color: '#4B5563' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>API Pagination Undercounts</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Identified <strong>{AUDIT_METRICS.projectMismatches} projects</strong> reporting inaccurate total listing counts due to API pagination bugs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Full API Findings */}
          <section className="card" style={{ padding: '1.75rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              Comprehensive API Audit Findings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FINDINGS.map((finding, idx) => (
                <div key={idx} style={{ 
                  padding: '1.25rem', 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div className="flex items-center gap-2">
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: 'var(--primary)', 
                      color: 'white', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {finding.category.replace('_', ' ')}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {finding.endpoint}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Documented Behavior</div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, opacity: 0.8 }}>
                        {finding.documented}
                      </p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Actual Behavior</div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {finding.actual}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Impact</div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                      {finding.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default Dashboard;
