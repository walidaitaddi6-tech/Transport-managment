import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function VehicleListPage() {
  return (
    <PlaceholderPage
      title="Liste des véhicules"
      breadcrumbs={[
        { label: 'Accueil', to: '/' },
        { label: 'Véhicules', to: '/vehicules' },
        { label: 'Liste des véhicules' },
      ]}
    />
  );
}
