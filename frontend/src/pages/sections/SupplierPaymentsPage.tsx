import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function SupplierPaymentsPage() {
  return (
    <PlaceholderPage
      title="Paiements fournisseurs"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Paiements fournisseurs' }]}
    />
  );
}
