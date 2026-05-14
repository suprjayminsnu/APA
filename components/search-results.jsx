/* global React, Icon, FacilityCard */

/* ============================================================
   Full search results overlay (triggered from hero search)
   ============================================================ */
function SearchResultsBar({ filters, totalCount }) {
  if (!filters || (!filters.dtype && !filters.sport && !filters.query && !filters.weekend)) return null;

  return (
    <div style={{
      background:'var(--ink)', color:'var(--canvas)',
      padding:'14px 0',
      position:'sticky', top:76, zIndex:30,
    }}>
      <div className="wrap" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <Icon name="search" size={16} color="var(--orbit-amber)"/>
        <span style={{ fontSize:13.5, fontWeight:600 }}>검색 결과</span>
        {filters.region && (
          <span style={{
            background:'rgba(255,255,255,0.12)', borderRadius:999,
            padding:'4px 12px', fontSize:12.5, fontWeight:600,
            display:'flex', alignItems:'center', gap:6,
          }}>
            <Icon name="map-pin" size={12} color="var(--orbit-amber)"/>
            {filters.region}
          </span>
        )}
        {filters.dtype && (
          <span style={{
            background:'var(--orbit-rust)', borderRadius:999,
            padding:'4px 12px', fontSize:12.5, fontWeight:700,
          }}>
            {filters.dtype}
          </span>
        )}
        {filters.sport && (
          <span style={{
            background:'rgba(255,255,255,0.12)', borderRadius:999,
            padding:'4px 12px', fontSize:12.5, fontWeight:600,
          }}>
            {filters.sport}
          </span>
        )}
        {filters.weekend && (
          <span style={{
            background:'rgba(255,255,255,0.12)', borderRadius:999,
            padding:'4px 12px', fontSize:12.5, fontWeight:600,
          }}>
            주말 운영
          </span>
        )}
        <span style={{ marginLeft:'auto', fontSize:13, color:'rgba(255,255,255,0.6)' }}>
          {totalCount}개 시설
        </span>
      </div>
    </div>
  );
}

window.SearchResultsBar = SearchResultsBar;
