import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function TripsPage() {
  return (
    <PlaceholderPage
      title="Voyages"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Voyages' }]}
    />
  );
}
