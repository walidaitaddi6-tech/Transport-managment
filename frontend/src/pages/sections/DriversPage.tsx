import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function DriversPage() {
  return (
    <PlaceholderPage
      title="Conducteurs"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Conducteurs' }]}
    />
  );
}
