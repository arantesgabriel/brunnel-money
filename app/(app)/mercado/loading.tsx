export default function MarketLoading() {
  return (
    <div
      className="page market-page"
      aria-busy="true"
      aria-label="Carregando mercado"
    >
      <div className="loading-dashboard-header">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton market-loading-overview" />
      <div className="skeleton market-loading-list" />
    </div>
  );
}
