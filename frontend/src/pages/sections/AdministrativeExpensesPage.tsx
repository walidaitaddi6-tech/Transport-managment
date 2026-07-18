import { PlaceholderPage } from '../../components/common/PlaceholderPage';

export function AdministrativeExpensesPage() {
  return (
    <PlaceholderPage
      title="Charges administratives"
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Charges administratives' }]}
    />
  );
}
