import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function VehicleDocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents véhicules"
      breadcrumbs={[
        { label: 'Accueil', to: '/' },
        { label: 'Véhicules', to: '/vehicules' },
        { label: 'Documents véhicules' },
      ]}
    />
  );
}
