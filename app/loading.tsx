export default function Loading() {
  return (
    <div
      className="page dashboard-loading redesigned-home"
      aria-busy="true"
      aria-label="Carregando visão geral"
    >
      <div className="loading-dashboard-header">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="loading-dashboard-grid">
        <div className="skeleton loading-available" />
        <div className="skeleton loading-distribution" />
        <div className="skeleton loading-movements" />
        <div className="skeleton loading-compact" />
        <div className="skeleton loading-compact" />
      </div>
    </div>
  );
}
