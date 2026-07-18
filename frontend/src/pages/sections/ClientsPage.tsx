import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function ClientsPage() {
  return (
    <PlaceholderPage
      title="Clients"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Clients' }]}
    />
  );
}
