import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function InvoicesPage() {
  return (
    <PlaceholderPage
      title="Factures"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Factures' }]}
    />
  );
}
