-- =====================================================================
--  Migration initiale (baseline) — structure conforme au schéma validé.
--  NB : pas de BEGIN/COMMIT ni de données de démonstration ici : Prisma
--  exécute chaque migration dans sa propre transaction. Les rôles par
--  défaut sont insérés via `prisma db seed` (prisma/seed.ts).
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Types énumérés
CREATE TYPE user_statut       AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');
CREATE TYPE client_statut     AS ENUM ('ACTIF', 'INACTIF', 'BLOQUE');
CREATE TYPE conducteur_statut AS ENUM ('DISPONIBLE', 'EN_VOYAGE', 'INDISPONIBLE', 'INACTIF');
CREATE TYPE vehicule_statut   AS ENUM ('DISPONIBLE', 'EN_VOYAGE', 'MAINTENANCE', 'HORS_SERVICE');
CREATE TYPE document_statut   AS ENUM ('VALIDE', 'BIENTOT_EXPIRE', 'EXPIRE');
CREATE TYPE voyage_type       AS ENUM ('NATIONAL', 'INTERNATIONAL', 'IMPORT', 'EXPORT');
CREATE TYPE voyage_statut     AS ENUM ('PLANIFIE', 'EN_COURS', 'LIVRE', 'ANNULE', 'FACTURE');
CREATE TYPE paiement_methode  AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'EFFET', 'PRELEVEMENT');
CREATE TYPE creance_statut    AS ENUM ('NON_PAYE', 'PARTIEL', 'PAYE', 'EN_RETARD');
CREATE TYPE dette_statut      AS ENUM ('OUVERTE', 'PARTIELLE', 'SOLDEE', 'EN_RETARD');
CREATE TYPE gestion_statut    AS ENUM ('EN_ATTENTE', 'PAYE', 'EN_RETARD', 'ANNULE');

-- Fonction trigger : mis_a_jour_le
CREATE OR REPLACE FUNCTION set_mis_a_jour_le()
RETURNS TRIGGER AS $$
BEGIN
    NEW.mis_a_jour_le := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. ROLES
CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom         VARCHAR(50)  NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_roles_nom UNIQUE (nom)
);

-- 2. USERS
CREATE TABLE users (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom                VARCHAR(120) NOT NULL,
    email              CITEXT       NOT NULL,
    telephone          VARCHAR(30),
    mot_de_passe       VARCHAR(255) NOT NULL,
    id_role            BIGINT       NOT NULL,
    statut             user_statut  NOT NULL DEFAULT 'ACTIF',
    derniere_connexion TIMESTAMPTZ,
    cree_le            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_role  FOREIGN KEY (id_role)
        REFERENCES roles (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_users_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
CREATE INDEX idx_users_id_role ON users (id_role);
CREATE INDEX idx_users_statut  ON users (statut);

-- 3. CLIENTS
CREATE TABLE clients (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_entreprise       VARCHAR(150) NOT NULL,
    ice                  VARCHAR(15),
    telephone            VARCHAR(30),
    email                CITEXT,
    adresse              VARCHAR(255),
    delai_paiement_jours INTEGER      NOT NULL DEFAULT 30,
    limite_credit        NUMERIC(14,2) NOT NULL DEFAULT 0,
    statut               client_statut NOT NULL DEFAULT 'ACTIF',
    CONSTRAINT uq_clients_ice     UNIQUE (ice),
    CONSTRAINT chk_clients_delai  CHECK (delai_paiement_jours >= 0),
    CONSTRAINT chk_clients_credit CHECK (limite_credit >= 0)
);
CREATE INDEX idx_clients_nom_entreprise ON clients (nom_entreprise);
CREATE INDEX idx_clients_statut         ON clients (statut);

-- 4. CONDUCTEURS
CREATE TABLE conducteurs (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_conducteur VARCHAR(150) NOT NULL,
    telephone      VARCHAR(30),
    adresse        VARCHAR(255),
    statut         conducteur_statut NOT NULL DEFAULT 'DISPONIBLE',
    cree_le        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_conducteurs_nom    ON conducteurs (nom_conducteur);
CREATE INDEX idx_conducteurs_statut ON conducteurs (statut);

-- 5. VEHICULES
CREATE TABLE vehicules (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    immatriculation VARCHAR(20)  NOT NULL,
    marque          VARCHAR(60)  NOT NULL,
    modele          VARCHAR(60),
    type_vehicule   VARCHAR(40)  NOT NULL DEFAULT 'CAMION',
    annee           SMALLINT,
    numero_chassis  VARCHAR(50),
    capacite_charge NUMERIC(8,2),
    statut          vehicule_statut NOT NULL DEFAULT 'DISPONIBLE',
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_vehicules_immat   UNIQUE (immatriculation),
    CONSTRAINT uq_vehicules_chassis UNIQUE (numero_chassis),
    CONSTRAINT chk_vehicules_annee  CHECK (annee IS NULL OR annee BETWEEN 1950 AND 2100),
    CONSTRAINT chk_vehicules_charge CHECK (capacite_charge IS NULL OR capacite_charge >= 0)
);
CREATE INDEX idx_vehicules_statut ON vehicules (statut);
CREATE INDEX idx_vehicules_type   ON vehicules (type_vehicule);

-- 6. DOCUMENTS_VEHICULES
CREATE TABLE documents_vehicules (
    id_document     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    immatriculation VARCHAR(20)  NOT NULL,
    type_document   VARCHAR(50)  NOT NULL,
    numero_document VARCHAR(60),
    date_emission   DATE,
    date_expiration DATE,
    chemin_fichier  VARCHAR(500),
    statut          document_statut NOT NULL DEFAULT 'VALIDE',
    notes           VARCHAR(255),
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_docveh_vehicule FOREIGN KEY (immatriculation)
        REFERENCES vehicules (immatriculation) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_docveh_dates CHECK (date_expiration IS NULL OR date_emission IS NULL OR date_expiration >= date_emission)
);
CREATE INDEX idx_docveh_immat      ON documents_vehicules (immatriculation);
CREATE INDEX idx_docveh_expiration ON documents_vehicules (date_expiration);
CREATE INDEX idx_docveh_statut     ON documents_vehicules (statut);

-- 7. DOCUMENTS_CONDUCTEURS
CREATE TABLE documents_conducteurs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conducteur   BIGINT       NOT NULL,
    type_document   VARCHAR(50)  NOT NULL,
    numero_document VARCHAR(60),
    date_emission   DATE,
    date_expiration DATE,
    chemin_fichier  VARCHAR(500),
    statut          document_statut NOT NULL DEFAULT 'VALIDE',
    notes           VARCHAR(255),
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    mis_a_jour_le   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_doccond_conducteur FOREIGN KEY (id_conducteur)
        REFERENCES conducteurs (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_doccond_dates CHECK (date_expiration IS NULL OR date_emission IS NULL OR date_expiration >= date_emission)
);
CREATE INDEX idx_doccond_conducteur ON documents_conducteurs (id_conducteur);
CREATE INDEX idx_doccond_expiration ON documents_conducteurs (date_expiration);
CREATE INDEX idx_doccond_statut     ON documents_conducteurs (statut);
CREATE TRIGGER trg_doccond_maj BEFORE UPDATE ON documents_conducteurs
    FOR EACH ROW EXECUTE FUNCTION set_mis_a_jour_le();

-- 8. VOYAGES
CREATE TABLE voyages (
    id_voyage         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type_voyage       voyage_type  NOT NULL DEFAULT 'NATIONAL',
    tracteur          VARCHAR(20),
    remorque          VARCHAR(20),
    nom_conducteur    VARCHAR(150),
    nom_client        VARCHAR(150),
    lieu_chargement   VARCHAR(150) NOT NULL,
    lieu_dechargement VARCHAR(150) NOT NULL,
    date_chargement   DATE,
    numero_cmr        VARCHAR(50),
    statut            voyage_statut NOT NULL DEFAULT 'PLANIFIE',
    montant_voyage    NUMERIC(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_voyages_tracteur FOREIGN KEY (tracteur)
        REFERENCES vehicules (immatriculation) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_voyages_remorque FOREIGN KEY (remorque)
        REFERENCES vehicules (immatriculation) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_voyages_montant CHECK (montant_voyage >= 0)
);
CREATE INDEX idx_voyages_statut     ON voyages (statut);
CREATE INDEX idx_voyages_client     ON voyages (nom_client);
CREATE INDEX idx_voyages_conducteur ON voyages (nom_conducteur);
CREATE INDEX idx_voyages_tracteur   ON voyages (tracteur);
CREATE INDEX idx_voyages_date_charg ON voyages (date_chargement);

-- 9. BONS_CARBURANT
CREATE TABLE bons_carburant (
    id_bon         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    immatriculation VARCHAR(20) NOT NULL,
    nom_conducteur VARCHAR(150),
    nom_station    VARCHAR(120),
    litres         NUMERIC(10,2) NOT NULL,
    prix_par_litre NUMERIC(10,3) NOT NULL,
    montant_total  NUMERIC(14,2) GENERATED ALWAYS AS (round(litres * prix_par_litre, 2)) STORED,
    date_carburant DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_boncarb_vehicule FOREIGN KEY (immatriculation)
        REFERENCES vehicules (immatriculation) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_boncarb_litres CHECK (litres > 0),
    CONSTRAINT chk_boncarb_prix   CHECK (prix_par_litre >= 0)
);
CREATE INDEX idx_boncarb_immat ON bons_carburant (immatriculation);
CREATE INDEX idx_boncarb_date  ON bons_carburant (date_carburant);

-- 10. DEPENSES_VEHICULES
CREATE TABLE depenses_vehicules (
    id_depense        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categorie_depense VARCHAR(60) NOT NULL,
    type_facture      VARCHAR(40),
    immatriculation   VARCHAR(20) NOT NULL,
    description       VARCHAR(255),
    fichier_recu      VARCHAR(500),
    montant           NUMERIC(14,2) NOT NULL,
    date_depense      DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_depveh_vehicule FOREIGN KEY (immatriculation)
        REFERENCES vehicules (immatriculation) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_depveh_montant CHECK (montant >= 0)
);
CREATE INDEX idx_depveh_immat     ON depenses_vehicules (immatriculation);
CREATE INDEX idx_depveh_categorie ON depenses_vehicules (categorie_depense);
CREATE INDEX idx_depveh_date      ON depenses_vehicules (date_depense);

-- 11. DEPENSES_ADMINISTRATIVES
CREATE TABLE depenses_administratives (
    id_depense        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categorie_depense VARCHAR(60) NOT NULL,
    description       VARCHAR(255),
    fichier_recu      VARCHAR(500),
    montant           NUMERIC(14,2) NOT NULL,
    date_depense      DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT chk_depadmin_montant CHECK (montant >= 0)
);
CREATE INDEX idx_depadmin_categorie ON depenses_administratives (categorie_depense);
CREATE INDEX idx_depadmin_date      ON depenses_administratives (date_depense);

-- 12. FACTURES
CREATE TABLE factures (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_facture     VARCHAR(30)  NOT NULL,
    nom_client         VARCHAR(150) NOT NULL,
    id_voyage          BIGINT,
    date_facture       DATE         NOT NULL DEFAULT CURRENT_DATE,
    jours_echeance     INTEGER      NOT NULL DEFAULT 30,
    date_echeance      DATE         GENERATED ALWAYS AS (date_facture + jours_echeance) STORED,
    devise             VARCHAR(3)   NOT NULL DEFAULT 'MAD',
    sous_total         NUMERIC(14,2) NOT NULL DEFAULT 0,
    taux_tva           NUMERIC(5,2)  NOT NULL DEFAULT 20.00,
    montant_tva        NUMERIC(14,2) GENERATED ALWAYS AS (round(sous_total * taux_tva / 100, 2)) STORED,
    montant_total      NUMERIC(14,2) GENERATED ALWAYS AS (sous_total + round(sous_total * taux_tva / 100, 2)) STORED,
    montant_en_lettres VARCHAR(255),
    chemin_pdf         VARCHAR(500),
    notes              VARCHAR(500),
    fichier_joint      VARCHAR(500),
    cree_par           BIGINT,
    cree_le            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    mis_a_jour_le      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    supprime_le        TIMESTAMPTZ,
    CONSTRAINT uq_factures_numero UNIQUE (numero_facture),
    CONSTRAINT fk_factures_voyage FOREIGN KEY (id_voyage)
        REFERENCES voyages (id_voyage) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_factures_user   FOREIGN KEY (cree_par)
        REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_factures_sous_total CHECK (sous_total >= 0),
    CONSTRAINT chk_factures_tva        CHECK (taux_tva >= 0),
    CONSTRAINT chk_factures_echeance   CHECK (jours_echeance >= 0)
);
CREATE INDEX idx_factures_client   ON factures (nom_client);
CREATE INDEX idx_factures_voyage   ON factures (id_voyage);
CREATE INDEX idx_factures_echeance ON factures (date_echeance);
CREATE INDEX idx_factures_supprime ON factures (supprime_le);
CREATE TRIGGER trg_factures_maj BEFORE UPDATE ON factures
    FOR EACH ROW EXECUTE FUNCTION set_mis_a_jour_le();

-- 13. CREANCES_CLIENTS
CREATE TABLE creances_clients (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_facture       VARCHAR(30)  NOT NULL,
    date_emission        DATE         NOT NULL DEFAULT CURRENT_DATE,
    nom_client           VARCHAR(150) NOT NULL,
    delai_paiement_jours INTEGER      NOT NULL DEFAULT 30,
    montant_facture      NUMERIC(14,2) NOT NULL,
    montant_recu         NUMERIC(14,2) NOT NULL DEFAULT 0,
    solde                NUMERIC(14,2) GENERATED ALWAYS AS (montant_facture - montant_recu) STORED,
    date_echeance        DATE,
    statut_paiement      creance_statut NOT NULL DEFAULT 'NON_PAYE',
    action_recouvrement  VARCHAR(255),
    CONSTRAINT uq_creances_facture UNIQUE (numero_facture),
    CONSTRAINT fk_creances_facture FOREIGN KEY (numero_facture)
        REFERENCES factures (numero_facture) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_creances_montant CHECK (montant_facture >= 0 AND montant_recu >= 0),
    CONSTRAINT chk_creances_recu    CHECK (montant_recu <= montant_facture)
);
CREATE INDEX idx_creances_client ON creances_clients (nom_client);
CREATE INDEX idx_creances_statut ON creances_clients (statut_paiement);

-- 14. PAIEMENTS_CLIENTS
CREATE TABLE paiements_clients (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_facture   VARCHAR(30)  NOT NULL,
    nom_client       VARCHAR(150) NOT NULL,
    date_paiement    DATE         NOT NULL DEFAULT CURRENT_DATE,
    montant_recu     NUMERIC(14,2) NOT NULL,
    methode_paiement paiement_methode NOT NULL,
    CONSTRAINT fk_paiclient_facture FOREIGN KEY (numero_facture)
        REFERENCES factures (numero_facture) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_paiclient_montant CHECK (montant_recu > 0)
);
CREATE INDEX idx_paiclient_facture ON paiements_clients (numero_facture);
CREATE INDEX idx_paiclient_client  ON paiements_clients (nom_client);
CREATE INDEX idx_paiclient_date    ON paiements_clients (date_paiement);

-- 15. FOURNISSEURS
CREATE TABLE fournisseurs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_fournisseur VARCHAR(150) NOT NULL,
    ice             VARCHAR(15),
    telephone       VARCHAR(30),
    email           CITEXT,
    adresse         VARCHAR(255),
    statut          client_statut NOT NULL DEFAULT 'ACTIF',
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_fournisseurs_nom UNIQUE (nom_fournisseur),
    CONSTRAINT uq_fournisseurs_ice UNIQUE (ice)
);
CREATE INDEX idx_fournisseurs_statut ON fournisseurs (statut);

-- 16. DETTES_FOURNISSEURS
CREATE TABLE dettes_fournisseurs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_facture  VARCHAR(60)  NOT NULL,
    date_facture    DATE,
    nom_fournisseur VARCHAR(150) NOT NULL,
    categorie       VARCHAR(60),
    delai_paiement  INTEGER      NOT NULL DEFAULT 30,
    montant_du      NUMERIC(14,2) NOT NULL,
    montant_paye    NUMERIC(14,2) NOT NULL DEFAULT 0,
    solde           NUMERIC(14,2) GENERATED ALWAYS AS (montant_du - montant_paye) STORED,
    date_echeance   DATE         GENERATED ALWAYS AS (date_facture + delai_paiement) STORED,
    jours_retard    INTEGER      NOT NULL DEFAULT 0,
    statut          dette_statut NOT NULL DEFAULT 'OUVERTE',
    remarques       VARCHAR(255),
    CONSTRAINT fk_dettes_fournisseur FOREIGN KEY (nom_fournisseur)
        REFERENCES fournisseurs (nom_fournisseur) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_dettes_montant CHECK (montant_du >= 0 AND montant_paye >= 0),
    CONSTRAINT chk_dettes_paye    CHECK (montant_paye <= montant_du),
    CONSTRAINT chk_dettes_delai   CHECK (delai_paiement >= 0)
);
CREATE INDEX idx_dettes_fournisseur ON dettes_fournisseurs (nom_fournisseur);
CREATE INDEX idx_dettes_statut      ON dettes_fournisseurs (statut);
CREATE INDEX idx_dettes_echeance    ON dettes_fournisseurs (date_echeance);

-- 17. PAIEMENTS_FOURNISSEURS
CREATE TABLE paiements_fournisseurs (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_facture   VARCHAR(60)  NOT NULL,
    nom_fournisseur  VARCHAR(150) NOT NULL,
    date_paiement    DATE         NOT NULL DEFAULT CURRENT_DATE,
    reference        VARCHAR(80),
    montant_paye     NUMERIC(14,2) NOT NULL,
    methode_paiement paiement_methode NOT NULL,
    remarques        VARCHAR(255),
    CONSTRAINT fk_paifourn_fournisseur FOREIGN KEY (nom_fournisseur)
        REFERENCES fournisseurs (nom_fournisseur) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_paifourn_montant CHECK (montant_paye > 0)
);
CREATE INDEX idx_paifourn_fournisseur ON paiements_fournisseurs (nom_fournisseur);
CREATE INDEX idx_paifourn_facture     ON paiements_fournisseurs (numero_facture);
CREATE INDEX idx_paifourn_date        ON paiements_fournisseurs (date_paiement);

-- 18. GESTION_PAIEMENTS
CREATE TABLE gestion_paiements (
    id_paiement    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_entreprise VARCHAR(150) NOT NULL,
    type_document  VARCHAR(50),
    montant        NUMERIC(14,2) NOT NULL,
    beneficiaire   VARCHAR(150),
    date_creation  DATE         NOT NULL DEFAULT CURRENT_DATE,
    date_echeance  DATE,
    jours_restants INTEGER,
    jours_retard   INTEGER      NOT NULL DEFAULT 0,
    statut         gestion_statut NOT NULL DEFAULT 'EN_ATTENTE',
    CONSTRAINT chk_gestion_montant CHECK (montant >= 0)
);
CREATE INDEX idx_gestion_statut     ON gestion_paiements (statut);
CREATE INDEX idx_gestion_echeance   ON gestion_paiements (date_echeance);
CREATE INDEX idx_gestion_entreprise ON gestion_paiements (nom_entreprise);
