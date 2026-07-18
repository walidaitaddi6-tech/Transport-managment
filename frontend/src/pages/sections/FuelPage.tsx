import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function FuelPage() {
  return (
    <PlaceholderPage
      title="Consommation gasoil"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Consommation gasoil' }]}
    />
  );
}
