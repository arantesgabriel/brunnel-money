export default function TransactionsLoading() {
  return (
    <div
      className="page transactions-page"
      aria-busy="true"
      aria-label="Carregando lançamentos"
    >
      <div className="loading-dashboard-header">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton transactions-loading-overview" />
      <div className="skeleton transactions-loading-list" />
    </div>
  );
}
