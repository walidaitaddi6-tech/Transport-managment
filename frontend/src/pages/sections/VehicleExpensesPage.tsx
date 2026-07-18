import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function VehicleExpensesPage() {
  return (
    <PlaceholderPage
      title="Charges véhicules"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Charges véhicules' }]}
    />
  );
}
