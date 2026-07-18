import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function SuppliersPage() {
  return (
    <PlaceholderPage
      title="Fournisseurs"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Fournisseurs' }]}
    />
  );
}
