import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Gestion paiements"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Gestion paiements' }]}
    />
  );
}
