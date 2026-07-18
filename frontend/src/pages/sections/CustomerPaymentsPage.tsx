import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function CustomerPaymentsPage() {
  return (
    <PlaceholderPage
      title="Paiements clients"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Paiements clients' }]}
    />
  );
}
