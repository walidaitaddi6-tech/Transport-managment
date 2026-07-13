# Étape 2 — Base de données PostgreSQL : Modèle relationnel (spécification finale)

Documentation du schéma conforme aux 17 tables définies par le cahier des charges.

Scripts associés :
- [`database/01_schema.sql`](../../database/01_schema.sql) — structure (types, tables, PK, FK, contraintes, index, triggers)
- [`database/02_seed.sql`](../../database/02_seed.sql) — données de test

Cible : **PostgreSQL ≥ 14**.

---

## 1. Stratégie de liaison (important)

Le modèle fourni relie plusieurs tables par **clés naturelles** plutôt que par identifiants
techniques. La stratégie appliquée :

| Type de lien | Traitement | Tables concernées |
|---|---|---|
| **Clé naturelle unique** | `FOREIGN KEY` réelle | `immatriculation` (véhicules), `numero_facture` (factures) |
| **Identifiant technique** | `FOREIGN KEY` réelle | `id_role`, `id_conducteur`, `id_voyage`, `id_tracteur`, `id_remorque`, `cree_par` |
| **Référence par nom** (non garantie unique) | Colonne **indexée sans FK** | `nom_client`, `nom_conducteur`, `nom_fournisseur`, `nom_station`, `nom_entreprise` |

> Aucune colonne n'a été ajoutée ni retirée par rapport à la spécification. Les FK ne portent que
> sur des colonnes déjà présentes et réellement uniques, afin de garantir l'intégrité sans imposer
> d'unicité fragile sur des noms.

---

## 2. Diagramme des relations (ERD)

```
        ┌───────────┐
        │   roles   │ 1
        └─────┬─────┘
              │ N (id_role)
        ┌─────▼─────┐ 1 (cree_par)         ┌──────────────────────────┐
        │   users   ├──────────────────────► factures                 │
        └───────────┘                      └──────────┬───────────────┘
                                                       │ numero_facture (UNIQUE)
   ┌────────────┐   id_conducteur   ┌──────────────┐   │ 1
   │ conducteurs│◄──────────────────┤ documents_   │   │ 1
   └────────────┘ 1               N │ conducteurs  │   ▼ N
                                    └──────────────┘  creances_clients
   ┌────────────┐                                     paiements_clients
   │  clients   │  (lié par nom_client, sans FK)
   └────────────┘

   ┌────────────┐ immatriculation (UNIQUE)
   │ vehicules  │◄───────────────┬──────────────┬───────────────┬──────────────┐
   └─────┬──────┘ 1            N │            N │             N │            N │
      id │ (id_tracteur,          documents_      bons_carburant   depenses_     voyages
         │  id_remorque)          vehicules                        vehicules   (tracteur,
         └────────────────► factures                                            remorque)

   ┌─────────────────────┐ numero_facture (lien logique)  ┌────────────────────────┐
   │ dettes_fournisseurs │◄───────────────────────────────┤ paiements_fournisseurs │
   └─────────────────────┘                                └────────────────────────┘

   ┌──────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────┐
   │ depenses_administratives │   │    gestion_paiements     │   │ (échéancier global) │
   └──────────────────────────┘   └──────────────────────────┘   └─────────────────────┘
```

---

## 3. Tables, clés et liaisons

| # | Table | PK | FK réelles (→ cible) | Liens par nom (index) |
|---|---|---|---|---|
| 1 | `users` | id | id_role → roles | — |
| 2 | `roles` | id | — | — |
| 3 | `clients` | id | — | (référencé par nom_entreprise) |
| 4 | `conducteurs` | id | — | (référencé par nom_conducteur) |
| 5 | `vehicules` | id | — | (référencé par immatriculation) |
| 6 | `documents_vehicules` | id_document | immatriculation → vehicules | — |
| 7 | `documents_conducteurs` | id | id_conducteur → conducteurs | — |
| 8 | `voyages` | id_voyage | tracteur → vehicules ; remorque → vehicules | nom_client, nom_conducteur |
| 9 | `bons_carburant` | id_bon | immatriculation → vehicules | nom_conducteur |
| 10 | `depenses_vehicules` | id_depense | immatriculation → vehicules | — |
| 11 | `depenses_administratives` | id_depense | — | — |
| 12 | `factures` | id | id_voyage → voyages ; id_tracteur/id_remorque → vehicules ; cree_par → users | nom_client |
| 13 | `creances_clients` | id | numero_facture → factures (**UNIQUE**) | nom_client |
| 14 | `paiements_clients` | id | numero_facture → factures | nom_client |
| 15 | `dettes_fournisseurs` | id | — | nom_fournisseur |
| 16 | `paiements_fournisseurs` | id | — | nom_fournisseur, numero_facture |
| 17 | `gestion_paiements` | id_paiement | — | nom_entreprise |

---

## 4. Types énumérés (ENUM)

| ENUM | Valeurs |
|---|---|
| `user_statut` | ACTIF, INACTIF, SUSPENDU |
| `client_statut` | ACTIF, INACTIF, BLOQUE |
| `conducteur_statut` | DISPONIBLE, EN_VOYAGE, INDISPONIBLE, INACTIF |
| `vehicule_statut` | DISPONIBLE, EN_VOYAGE, MAINTENANCE, HORS_SERVICE |
| `document_statut` | VALIDE, BIENTOT_EXPIRE, EXPIRE |
| `voyage_type` | NATIONAL, INTERNATIONAL, IMPORT, EXPORT |
| `voyage_statut` | PLANIFIE, EN_COURS, LIVRE, ANNULE, FACTURE |
| `paiement_methode` | ESPECES, CHEQUE, VIREMENT, CARTE, EFFET, PRELEVEMENT |
| `creance_statut` | NON_PAYE, PARTIEL, PAYE, EN_RETARD |
| `dette_statut` | OUVERTE, PARTIELLE, SOLDEE, EN_RETARD |
| `gestion_statut` | EN_ATTENTE, PAYE, EN_RETARD, ANNULE |

Les champs `type_document`, `categorie_depense`, `type_facture`, `type_vehicule` restent en
`VARCHAR` (domaine ouvert), avec index sur les colonnes de filtre.

---

## 5. Contraintes métier notables

- **Unicité** : `users.email`, `clients.ice`, `vehicules.immatriculation` / `numero_chassis`,
  `factures.numero_facture`, `creances_clients.numero_facture` (1 créance par facture), `roles.nom`.
- **Colonnes générées** : `creances_clients.solde` = `montant_facture - montant_recu` ;
  `dettes_fournisseurs.solde` = `montant_du - montant_paye`.
- **CHECK** : montants ≥ 0 ; `litres > 0` ; montants de paiement > 0 ;
  `montant_recu <= montant_facture` ; `montant_paye <= montant_du` ;
  cohérence des dates de documents/factures ; format email.
- **Soft delete** : `factures.supprime_le` (les lignes ne sont pas supprimées physiquement).
- **Triggers** : `mis_a_jour_le` auto-actualisé sur `documents_conducteurs` et `factures`.

---

## 6. Exécution

```bash
createdb transport_db
psql -d transport_db -f database/01_schema.sql
psql -d transport_db -f database/02_seed.sql
```

**Comptes de test** (mot de passe `Passw0rd!`) : `admin@transport.ma`, `gestion@transport.ma`,
`compta@transport.ma`, `operateur@transport.ma`, `hassan.driver@transport.ma`.

---

## 7. Requêtes de vérification (post-seed)

```sql
-- Encours clients (créances non soldées)
SELECT nom_client, SUM(solde) AS encours
FROM creances_clients WHERE statut_paiement <> 'PAYE'
GROUP BY nom_client;

-- Dettes fournisseurs restantes
SELECT nom_fournisseur, SUM(solde) AS reste_a_payer
FROM dettes_fournisseurs WHERE statut <> 'SOLDEE'
GROUP BY nom_fournisseur;

-- Documents à surveiller
SELECT immatriculation AS ref, type_document, date_expiration, statut
FROM documents_vehicules WHERE statut <> 'VALIDE'
UNION ALL
SELECT nom_conducteur, type_document, date_expiration, statut
FROM documents_conducteurs dc
JOIN conducteurs c ON c.id = dc.id_conducteur
WHERE dc.statut <> 'VALIDE';

-- Coût carburant par véhicule
SELECT immatriculation, SUM(montant_total) AS total_carburant
FROM bons_carburant GROUP BY immatriculation;
```
