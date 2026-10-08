export default function BudgetLoading() {
  return (
    <div
      className="page budget-page"
      aria-busy="true"
      aria-label="Carregando orçamento"
    >
      <div className="loading-dashboard-header">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton budget-loading-overview" />
      <div className="skeleton budget-loading-actions" />
      <div className="skeleton budget-loading-list" />
    </div>
  );
}
