import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { TrendingUp, AlertTriangle, ShieldAlert, FileX, CheckCircle } from 'lucide-react';
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
    <div className="container">
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '2.5rem' }}>Gurgaon Real Estate Insights</h1>
        <p style={{ opacity: 0.9, fontSize: '1.125rem', maxWidth: '650px' }}>
          Comprehensive market analytics and verified audit findings for Gurgaon (City ID 6). 
          Synthesized from full-dataset reconciliation and API sampling, highlighting hidden discrepancies, pagination undercounts, and fraud detection.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Loading market insights and locality analytics...
        </div>
      ) : (
        <>
          {/* Alert Cards Aligned with Audit Findings */}
          <div className="grid grid-cols-4 md:grid-cols-1" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ color: '#991B1B', marginBottom: '0.5rem', fontWeight: 600 }}><ShieldAlert size={20} /> Fake Agents Found</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7F1D1D' }}>{AUDIT_METRICS.fakeAgentsCount}</div>
              <div style={{ fontSize: '0.875rem', color: '#991B1B', marginTop: '0.25rem' }}>Operating under aliases</div>
            </div>
            <div className="card" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ color: '#92400E', marginBottom: '0.5rem', fontWeight: 600 }}><AlertTriangle size={20} /> Fake Listings</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#78350F' }}>{AUDIT_METRICS.fakeCount}</div>
              <div style={{ fontSize: '0.875rem', color: '#92400E', marginTop: '0.25rem' }}>Identified via contact sharing</div>
            </div>
            <div className="card" style={{ backgroundColor: '#E0E7FF', borderColor: '#A5B4FC', padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ color: '#3730A3', marginBottom: '0.5rem', fontWeight: 600 }}><FileX size={20} /> Corrupt Records</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#312E81' }}>{AUDIT_METRICS.corruptCount}</div>
              <div style={{ fontSize: '0.875rem', color: '#3730A3', marginTop: '0.25rem' }}>Logically impossible data</div>
            </div>
            <div className="card" style={{ backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ color: '#374151', marginBottom: '0.5rem', fontWeight: 600 }}><TrendingUp size={20} /> Project Mismatches</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937' }}>{AUDIT_METRICS.projectMismatches}</div>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>Wrong listing counts</div>
            </div>
          </div>

          {/* Real Summary Data from Audit */}
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Verified Market Metrics <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(Audited against full 3,500 records)</span></h3>
          <div className="grid grid-cols-4 md:grid-cols-1" style={{ marginBottom: '3rem', gap: '1rem' }}>
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Listings</span>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)' }}>{AUDIT_METRICS.totalListings.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{AUDIT_METRICS.activeListings.toLocaleString()} active • {AUDIT_METRICS.reportedListingsTotal} reported by API</div>
            </div>
            <div className="card" style={{ borderTop: '4px solid var(--secondary)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Unique Properties</span>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)' }}>{AUDIT_METRICS.uniqueProperties.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>15 cross-portal duplicate pairs</div>
            </div>
            <div className="card" style={{ borderTop: '4px solid #10B981' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>2 BHK Price/Sqft</span>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)' }}>₹{Math.round(AUDIT_METRICS.avgPricePerSqft2Bhk).toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Excludes corrupt & fake listings</div>
            </div>
            <div className="card" style={{ borderTop: '4px solid #8B5CF6' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Recent Listings (7d)</span>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)' }}>{AUDIT_METRICS.recentListings7Days}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posted 7 days before reference date</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1" style={{ marginBottom: '3rem', alignItems: 'start', gap: '1.5rem' }}>
            {/* Locality Data */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Top Localities by Price</h3>
              <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.byLocality?.map((loc: any, idx: number) => (
                  <div key={loc.name} className="flex justify-between items-center" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-4">
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>{idx + 1}</span>
                      <span style={{ fontWeight: 500 }}>{loc.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{(loc.avg_price / 10000000).toFixed(2)} Cr</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Discoveries */}
            <div className="flex-col" style={{ display: 'flex', gap: '1.5rem' }}>
              <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                  <ShieldAlert size={24} color="#EF4444" />
                  <h3 style={{ color: '#991B1B', margin: 0 }}>Fraud Discovered</h3>
                </div>
                <p style={{ color: '#7F1D1D', fontSize: '0.95rem', margin: 0 }}>
                  We discovered <strong>12 fake agent accounts</strong> operating under multiple names, allowing us to successfully isolate <strong>{AUDIT_METRICS.fakeCount} fake listings</strong> that were generated solely to drive artificial inquiries.
                </p>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                  <FileX size={24} color="#F59E0B" />
                  <h3 style={{ color: '#92400E', margin: 0 }}>Corrupt Data Identified</h3>
                </div>
                <p style={{ color: '#78350F', fontSize: '0.95rem', margin: 0 }}>
                  Our audit flagged <strong>{AUDIT_METRICS.corruptCount} corrupt listings</strong> with impossible data (e.g., negative prices, or carpet area exceeding super built-up area). Furthermore, <strong>{AUDIT_METRICS.projectMismatches} projects</strong> report inaccurate listing counts.
                </p>
              </div>

              <div className="card" style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                  <CheckCircle size={24} color="#10B981" />
                  <h3 style={{ color: '#065F46', margin: 0 }}>API Discrepancies Handled</h3>
                </div>
                <p style={{ color: '#064E3B', fontSize: '0.95rem', margin: 0 }}>
                  The application seamlessly handles 21 documented API discrepancies—including silent 15-minute token refreshes, client-side filtering circumventing broken filter queries, and unit normalization for Crores and square meters.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
