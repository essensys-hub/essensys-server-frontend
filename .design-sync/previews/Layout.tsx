import { Layout } from 'essensys-web-react';

export const Default = () => (
  <Layout title="Tableau de bord">
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Bienvenue</h2>
      <p className="mt-2 text-sm text-gray-500">
        Le contenu de chaque page s'affiche dans cette zone, à l'intérieur de la
        coque applicative (en-tête, navigation latérale et barre mobile).
      </p>
    </div>
  </Layout>
);
