-- =====================================================================
--  APPLICATION DE GESTION DE TRANSPORT & LOGISTIQUE
--  Script SQL PostgreSQL COMPLET — prêt pour la production
--  Cible : PostgreSQL >= 14
--
--  Contenu : extensions, types ENUM, fonctions/triggers, 18 tables,
--            clés primaires (IDENTITY), clés étrangères, contraintes,
--            valeurs par défaut, colonnes générées, index, commentaires,
--            rôles par défaut et données de démonstration.
--
--  Exécution :  createdb transport_db
--               psql -d transport_db -f transport_db.sql
--
--  Idempotent au niveau base : conçu pour une base VIDE. Le bloc de
--  nettoyage optionnel ci-dessous permet de rejouer le script.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (Optionnel) Nettoyage pour rejouer le script sur une base existante.
-- Décommentez si nécessaire.
-- ---------------------------------------------------------------------
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

BEGIN;

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid(), crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS "citext";     -- e-mails insensibles à la casse

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- Fonction trigger : actualisation automatique de mis_a_jour_le
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_mis_a_jour_le()
RETURNS TRIGGER AS $$
BEGIN
    NEW.mis_a_jour_le := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. ROLES
-- =====================================================================
CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom         VARCHAR(50)  NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_roles_nom UNIQUE (nom)
);
COMMENT ON TABLE  roles             IS 'Rôles applicatifs (RBAC)';
COMMENT ON COLUMN roles.nom         IS 'Nom unique du rôle : ADMIN, GESTIONNAIRE, COMPTABLE, OPERATEUR, CONDUCTEUR';
COMMENT ON COLUMN roles.description IS 'Description fonctionnelle du rôle';

-- =====================================================================
-- 2. USERS
-- =====================================================================
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
COMMENT ON TABLE  users              IS 'Comptes utilisateurs et authentification';
COMMENT ON COLUMN users.email        IS 'E-mail unique servant d''identifiant de connexion';
COMMENT ON COLUMN users.mot_de_passe IS 'Hash du mot de passe (argon2 / bcrypt) — jamais en clair';
COMMENT ON COLUMN users.id_role      IS 'Rôle attribué (FK roles.id)';
COMMENT ON COLUMN users.statut       IS 'ACTIF / INACTIF / SUSPENDU';

-- =====================================================================
-- 3. CLIENTS
-- =====================================================================
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
    CONSTRAINT uq_clients_ice        UNIQUE (ice),
    CONSTRAINT chk_clients_delai     CHECK (delai_paiement_jours >= 0),
    CONSTRAINT chk_clients_credit    CHECK (limite_credit >= 0)
);
CREATE INDEX idx_clients_nom_entreprise ON clients (nom_entreprise);
CREATE INDEX idx_clients_statut         ON clients (statut);
COMMENT ON TABLE  clients                      IS 'Clients donneurs d''ordre';
COMMENT ON COLUMN clients.nom_entreprise       IS 'Raison sociale (clé de liaison par nom)';
COMMENT ON COLUMN clients.ice                  IS 'Identifiant Commun de l''Entreprise (Maroc)';
COMMENT ON COLUMN clients.delai_paiement_jours IS 'Délai de règlement accordé, en jours';
COMMENT ON COLUMN clients.limite_credit        IS 'Plafond d''encours autorisé';

-- =====================================================================
-- 4. CONDUCTEURS
-- =====================================================================
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
COMMENT ON TABLE  conducteurs                IS 'Conducteurs (chauffeurs)';
COMMENT ON COLUMN conducteurs.nom_conducteur IS 'Nom complet (clé de liaison par nom)';
COMMENT ON COLUMN conducteurs.statut         IS 'DISPONIBLE / EN_VOYAGE / INDISPONIBLE / INACTIF';

-- =====================================================================
-- 5. VEHICULES
-- =====================================================================
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
    CONSTRAINT uq_vehicules_immat    UNIQUE (immatriculation),
    CONSTRAINT uq_vehicules_chassis  UNIQUE (numero_chassis),
    CONSTRAINT chk_vehicules_annee   CHECK (annee IS NULL OR annee BETWEEN 1950 AND 2100),
    CONSTRAINT chk_vehicules_charge  CHECK (capacite_charge IS NULL OR capacite_charge >= 0)
);
CREATE INDEX idx_vehicules_statut ON vehicules (statut);
CREATE INDEX idx_vehicules_type   ON vehicules (type_vehicule);
COMMENT ON TABLE  vehicules                 IS 'Parc de véhicules (tracteurs, remorques, camions)';
COMMENT ON COLUMN vehicules.immatriculation IS 'Plaque unique servant de clé de liaison';
COMMENT ON COLUMN vehicules.type_vehicule   IS 'TRACTEUR / REMORQUE / CAMION / CITERNE / FRIGORIFIQUE...';
COMMENT ON COLUMN vehicules.statut          IS 'DISPONIBLE / EN_VOYAGE / MAINTENANCE / HORS_SERVICE';

-- =====================================================================
-- 6. DOCUMENTS_VEHICULES  (FK par immatriculation)
-- =====================================================================
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
COMMENT ON TABLE  documents_vehicules               IS 'Documents administratifs des véhicules';
COMMENT ON COLUMN documents_vehicules.type_document IS 'CARTE_GRISE / ASSURANCE / VISITE_TECHNIQUE / VIGNETTE...';
COMMENT ON COLUMN documents_vehicules.chemin_fichier IS 'URL du fichier stocké (S3 / Cloudinary)';
COMMENT ON COLUMN documents_vehicules.statut        IS 'VALIDE / BIENTOT_EXPIRE / EXPIRE';

-- =====================================================================
-- 7. DOCUMENTS_CONDUCTEURS  (FK id_conducteur)
-- =====================================================================
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
COMMENT ON TABLE  documents_conducteurs               IS 'Documents administratifs des conducteurs';
COMMENT ON COLUMN documents_conducteurs.type_document IS 'PERMIS / CIN / VISITE_MEDICALE / CONTRAT...';
COMMENT ON COLUMN documents_conducteurs.mis_a_jour_le IS 'Actualisé automatiquement par trigger';

-- =====================================================================
-- 8. VOYAGES  (tracteur/remorque -> immatriculation ; noms libres)
-- =====================================================================
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
COMMENT ON TABLE  voyages            IS 'Missions de transport';
COMMENT ON COLUMN voyages.tracteur   IS 'Immatriculation du tracteur (FK vehicules)';
COMMENT ON COLUMN voyages.remorque   IS 'Immatriculation de la remorque (FK vehicules)';
COMMENT ON COLUMN voyages.numero_cmr IS 'Numéro de lettre de voiture CMR';
COMMENT ON COLUMN voyages.statut     IS 'PLANIFIE / EN_COURS / LIVRE / ANNULE / FACTURE';

-- =====================================================================
-- 9. BONS_CARBURANT  (FK immatriculation ; montant_total généré)
-- =====================================================================
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
COMMENT ON TABLE  bons_carburant               IS 'Bons de carburant (pleins)';
COMMENT ON COLUMN bons_carburant.montant_total IS 'Calculé automatiquement = litres × prix_par_litre';

-- =====================================================================
-- 10. DEPENSES_VEHICULES  (FK immatriculation)
-- =====================================================================
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
COMMENT ON TABLE  depenses_vehicules                   IS 'Dépenses rattachées à un véhicule';
COMMENT ON COLUMN depenses_vehicules.categorie_depense IS 'ENTRETIEN / REPARATION / PNEUS / PEAGE / AMENDE...';
COMMENT ON COLUMN depenses_vehicules.type_facture      IS 'FACTURE / BON / RECU / SANS';

-- =====================================================================
-- 11. DEPENSES_ADMINISTRATIVES
-- =====================================================================
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
COMMENT ON TABLE  depenses_administratives                   IS 'Frais généraux / administratifs';
COMMENT ON COLUMN depenses_administratives.categorie_depense IS 'LOYER / SALAIRE / TELECOM / IMPOTS / HONORAIRES...';

-- =====================================================================
-- 12. FACTURES  (normalisée : détails via id_voyage ; TVA/TTC/échéance générés)
-- =====================================================================
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
COMMENT ON TABLE  factures               IS 'Factures clients (document légal, soft delete)';
COMMENT ON COLUMN factures.numero_facture IS 'Numéro séquentiel légal, unique';
COMMENT ON COLUMN factures.id_voyage     IS 'Voyage facturé — source des détails (CMR, trajet, véhicules)';
COMMENT ON COLUMN factures.montant_tva   IS 'Généré = sous_total × taux_tva / 100';
COMMENT ON COLUMN factures.montant_total IS 'Généré = sous_total + montant_tva (TTC)';
COMMENT ON COLUMN factures.date_echeance IS 'Généré = date_facture + jours_echeance';
COMMENT ON COLUMN factures.supprime_le   IS 'Horodatage de suppression logique (soft delete)';

-- =====================================================================
-- 13. CREANCES_CLIENTS  (FK numero_facture ; solde généré ; 1-1 facture)
-- =====================================================================
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
COMMENT ON TABLE  creances_clients        IS 'Encours clients (une créance par facture)';
COMMENT ON COLUMN creances_clients.solde  IS 'Généré = montant_facture - montant_recu';
COMMENT ON COLUMN creances_clients.statut_paiement IS 'NON_PAYE / PARTIEL / PAYE / EN_RETARD';

-- =====================================================================
-- 14. PAIEMENTS_CLIENTS  (FK numero_facture)
-- =====================================================================
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
COMMENT ON TABLE  paiements_clients                  IS 'Encaissements clients (règlements partiels possibles)';
COMMENT ON COLUMN paiements_clients.methode_paiement IS 'ESPECES / CHEQUE / VIREMENT / CARTE / EFFET / PRELEVEMENT';

-- =====================================================================
-- 15. FOURNISSEURS  (référentiel — clé de liaison nom_fournisseur)
-- =====================================================================
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
COMMENT ON TABLE  fournisseurs                 IS 'Référentiel des fournisseurs';
COMMENT ON COLUMN fournisseurs.nom_fournisseur IS 'Raison sociale unique (clé de liaison par nom)';
COMMENT ON COLUMN fournisseurs.ice             IS 'Identifiant Commun de l''Entreprise (Maroc)';

-- =====================================================================
-- 16. DETTES_FOURNISSEURS  (FK nom_fournisseur ; solde/échéance générés)
-- =====================================================================
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
COMMENT ON TABLE  dettes_fournisseurs               IS 'Dettes envers les fournisseurs';
COMMENT ON COLUMN dettes_fournisseurs.numero_facture IS 'Numéro de la facture fournisseur';
COMMENT ON COLUMN dettes_fournisseurs.solde         IS 'Généré = montant_du - montant_paye';
COMMENT ON COLUMN dettes_fournisseurs.date_echeance IS 'Généré = date_facture + delai_paiement';
COMMENT ON COLUMN dettes_fournisseurs.jours_retard  IS 'Recalculé périodiquement (dépend de la date courante)';

-- =====================================================================
-- 17. PAIEMENTS_FOURNISSEURS  (FK nom_fournisseur)
-- =====================================================================
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
COMMENT ON TABLE  paiements_fournisseurs           IS 'Décaissements vers les fournisseurs';
COMMENT ON COLUMN paiements_fournisseurs.reference IS 'Référence virement / chèque / effet';

-- =====================================================================
-- 18. GESTION_PAIEMENTS  (échéancier de trésorerie transversal)
-- =====================================================================
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
COMMENT ON TABLE  gestion_paiements                IS 'Échéancier consolidé de trésorerie (suivi des paiements à venir)';
COMMENT ON COLUMN gestion_paiements.type_document  IS 'FACTURE / CHEQUE / EFFET / VIREMENT';
COMMENT ON COLUMN gestion_paiements.jours_restants IS 'Recalculé périodiquement (dépend de la date courante)';
COMMENT ON COLUMN gestion_paiements.jours_retard   IS 'Recalculé périodiquement (dépend de la date courante)';

-- =====================================================================
--  DONNÉES PAR DÉFAUT — RÔLES
-- =====================================================================
INSERT INTO roles (nom, description) VALUES
('ADMIN',        'Administrateur système, accès total'),
('GESTIONNAIRE', 'Gestion opérationnelle : voyages, véhicules, conducteurs, clients'),
('COMPTABLE',    'Facturation, créances, dettes et comptabilité'),
('OPERATEUR',    'Saisie et suivi des voyages'),
('CONDUCTEUR',   'Application mobile conducteur');

-- =====================================================================
--  DONNÉES DE DÉMONSTRATION (SEED)
--  Mot de passe en clair de tous les comptes : 'Passw0rd!'
-- =====================================================================

-- USERS
INSERT INTO users (nom, email, telephone, mot_de_passe, id_role, statut) VALUES
('Oualid Ait Addi',  'admin@transport.ma',         '+212600000001', crypt('Passw0rd!', gen_salt('bf')), (SELECT id FROM roles WHERE nom='ADMIN'),        'ACTIF'),
('Karim El Amrani',  'gestion@transport.ma',       '+212600000002', crypt('Passw0rd!', gen_salt('bf')), (SELECT id FROM roles WHERE nom='GESTIONNAIRE'), 'ACTIF'),
('Salma Bennani',    'compta@transport.ma',        '+212600000003', crypt('Passw0rd!', gen_salt('bf')), (SELECT id FROM roles WHERE nom='COMPTABLE'),    'ACTIF'),
('Yassine Ouhssain', 'operateur@transport.ma',     '+212600000004', crypt('Passw0rd!', gen_salt('bf')), (SELECT id FROM roles WHERE nom='OPERATEUR'),    'ACTIF'),
('Hassan Boutaib',   'hassan.driver@transport.ma', '+212600000005', crypt('Passw0rd!', gen_salt('bf')), (SELECT id FROM roles WHERE nom='CONDUCTEUR'),   'ACTIF');

-- CLIENTS
INSERT INTO clients (nom_entreprise, ice, telephone, email, adresse, delai_paiement_jours, limite_credit, statut) VALUES
('Souss Agro SARL',        '001234567000021', '+212528000010', 'contact@soussagro.ma',    'Z.I. Ait Melloul, Agadir', 60, 200000.00, 'ACTIF'),
('Atlas Logistics SA',     '001234567000038', '+212522000020', 'ops@atlaslog.ma',         'Bd Zerktouni, Casablanca', 45, 500000.00, 'ACTIF'),
('Marrakech Distribution', '001234567000045', '+212524000030', 'achat@marrakdist.ma',     'Route de Fès, Marrakech',  30, 150000.00, 'ACTIF'),
('EuroMaroc Export',       '001234567000052', '+212539000040', 'logistique@euromaroc.eu', 'Port Tanger Med, Tanger',  90, 800000.00, 'ACTIF');

-- CONDUCTEURS
INSERT INTO conducteurs (nom_conducteur, telephone, adresse, statut) VALUES
('Hassan Boutaib',  '+212600000005', 'Hay Mohammadi, Agadir', 'EN_VOYAGE'),
('Mohamed Idrissi', '+212600000006', 'Dcheira, Agadir',       'DISPONIBLE'),
('Brahim Fageer',   '+212600000007', 'Inezgane, Agadir',      'INDISPONIBLE');

-- VEHICULES
INSERT INTO vehicules (immatriculation, marque, modele, type_vehicule, annee, numero_chassis, capacite_charge, statut) VALUES
('12345-A-6', 'Volvo',    'FH16',   'TRACTEUR',     2020, 'CHVOL2020001', 40.00, 'DISPONIBLE'),
('67890-B-6', 'Mercedes', 'Actros', 'TRACTEUR',     2019, 'CHMER2019002', 40.00, 'EN_VOYAGE'),
('54321-C-6', 'Renault',  'T High', 'CAMION',       2021, 'CHREN2021003', 26.00, 'DISPONIBLE'),
('R-1001-6',  'Schmitz',  'SKO24',  'REMORQUE',     2019, 'CHSCH2019010', 34.00, 'DISPONIBLE'),
('R-1002-6',  'Krone',    'ProfiL', 'FRIGORIFIQUE', 2020, 'CHKRO2020011', 33.00, 'EN_VOYAGE');

-- DOCUMENTS_VEHICULES
INSERT INTO documents_vehicules (immatriculation, type_document, numero_document, date_emission, date_expiration, chemin_fichier, statut, notes) VALUES
('12345-A-6', 'ASSURANCE',        'ASS-2026-001', '2026-01-01', '2026-12-31', 's3://transport/docs/ass-12345.pdf', 'VALIDE',         'Police multirisque'),
('12345-A-6', 'VISITE_TECHNIQUE', 'VT-2026-001',  '2026-02-15', '2026-08-15', 's3://transport/docs/vt-12345.pdf',  'BIENTOT_EXPIRE', NULL),
('67890-B-6', 'CARTE_GRISE',      'CG-67890',     '2019-05-11', NULL,         's3://transport/docs/cg-67890.pdf',  'VALIDE',         NULL),
('54321-C-6', 'ASSURANCE',        'ASS-2025-003', '2025-01-01', '2025-12-31', 's3://transport/docs/ass-54321.pdf', 'EXPIRE',         'À renouveler');

-- DOCUMENTS_CONDUCTEURS
INSERT INTO documents_conducteurs (id_conducteur, type_document, numero_document, date_emission, date_expiration, chemin_fichier, statut, notes) VALUES
((SELECT id FROM conducteurs WHERE nom_conducteur='Hassan Boutaib'),  'PERMIS',          'PERM-0001', '2016-04-01', '2026-04-01', 's3://transport/docs/perm-0001.pdf', 'BIENTOT_EXPIRE', 'Catégorie CE'),
((SELECT id FROM conducteurs WHERE nom_conducteur='Hassan Boutaib'),  'VISITE_MEDICALE', 'VM-2026-01','2026-01-10', '2027-01-10', 's3://transport/docs/vm-0001.pdf',   'VALIDE',         NULL),
((SELECT id FROM conducteurs WHERE nom_conducteur='Mohamed Idrissi'), 'PERMIS',          'PERM-0002', '2018-08-20', '2028-08-20', 's3://transport/docs/perm-0002.pdf', 'VALIDE',         NULL);

-- VOYAGES
INSERT INTO voyages (type_voyage, tracteur, remorque, nom_conducteur, nom_client, lieu_chargement, lieu_dechargement, date_chargement, numero_cmr, statut, montant_voyage) VALUES
('NATIONAL',      '67890-B-6', 'R-1002-6', 'Hassan Boutaib',  'Souss Agro SARL',        'Agadir', 'Casablanca', '2026-07-01', 'CMR-0001', 'LIVRE',    12000.00),
('INTERNATIONAL', '67890-B-6', 'R-1002-6', 'Mohamed Idrissi', 'EuroMaroc Export',       'Agadir', 'Tanger',     '2026-07-12', 'CMR-0002', 'EN_COURS', 22000.00),
('NATIONAL',      '54321-C-6', 'R-1001-6', 'Brahim Fageer',   'Marrakech Distribution', 'Agadir', 'Marrakech',  '2026-07-15', 'CMR-0003', 'PLANIFIE',  6000.00);

-- BONS_CARBURANT (montant_total généré automatiquement)
INSERT INTO bons_carburant (immatriculation, nom_conducteur, nom_station, litres, prix_par_litre, date_carburant) VALUES
('67890-B-6', 'Hassan Boutaib',  'Afriquia Agadir', 300.00, 12.500, '2026-07-01'),
('67890-B-6', 'Mohamed Idrissi', 'Shell Marrakech', 450.00, 12.500, '2026-07-12'),
('54321-C-6', 'Brahim Fageer',   'Total Inezgane',  200.00, 12.400, '2026-07-14');

-- DEPENSES_VEHICULES
INSERT INTO depenses_vehicules (categorie_depense, type_facture, immatriculation, description, fichier_recu, montant, date_depense) VALUES
('REPARATION', 'FACTURE', '54321-C-6', 'Réparation freins', 's3://transport/recus/rep-54321.pdf', 4200.00, '2026-07-05'),
('PEAGE',      'SANS',    '67890-B-6', 'Péage Agadir-Casa', NULL,                                  320.00,  '2026-07-01');

-- DEPENSES_ADMINISTRATIVES
INSERT INTO depenses_administratives (categorie_depense, description, fichier_recu, montant, date_depense) VALUES
('LOYER',   'Loyer bureaux juillet',     's3://transport/recus/loyer-07.pdf', 12000.00, '2026-07-01'),
('TELECOM', 'Abonnement fibre + flotte', NULL,                                 1500.00, '2026-07-03'),
('SALAIRE', 'Salaires administratifs',   NULL,                                45000.00, '2026-07-31');

-- FACTURES (montant_tva, montant_total, date_echeance générés automatiquement)
INSERT INTO factures (numero_facture, nom_client, id_voyage, date_facture, jours_echeance, devise, sous_total, taux_tva, montant_en_lettres, chemin_pdf, cree_par) VALUES
('FAC-2026-0001', 'Souss Agro SARL',
    (SELECT id_voyage FROM voyages WHERE numero_cmr='CMR-0001'),
    '2026-07-02', 30, 'MAD', 12000.00, 20.00,
    'Quatorze mille quatre cents dirhams', 's3://transport/factures/FAC-2026-0001.pdf',
    (SELECT id FROM users WHERE email='compta@transport.ma')),
('FAC-2026-0002', 'EuroMaroc Export',
    (SELECT id_voyage FROM voyages WHERE numero_cmr='CMR-0002'),
    '2026-07-12', 90, 'MAD', 22000.00, 20.00,
    'Vingt-six mille quatre cents dirhams', 's3://transport/factures/FAC-2026-0002.pdf',
    (SELECT id FROM users WHERE email='compta@transport.ma'));

-- CREANCES_CLIENTS (solde généré automatiquement)
INSERT INTO creances_clients (numero_facture, date_emission, nom_client, delai_paiement_jours, montant_facture, montant_recu, date_echeance, statut_paiement, action_recouvrement) VALUES
('FAC-2026-0001', '2026-07-02', 'Souss Agro SARL',  30, 14400.00, 5000.00, '2026-08-01', 'PARTIEL',  'Relance téléphonique effectuée'),
('FAC-2026-0002', '2026-07-12', 'EuroMaroc Export', 90, 26400.00, 0.00,    '2026-10-10', 'NON_PAYE', NULL);

-- PAIEMENTS_CLIENTS
INSERT INTO paiements_clients (numero_facture, nom_client, date_paiement, montant_recu, methode_paiement) VALUES
('FAC-2026-0001', 'Souss Agro SARL', '2026-07-10', 5000.00, 'VIREMENT');

-- FOURNISSEURS
INSERT INTO fournisseurs (nom_fournisseur, ice, telephone, email, adresse, statut) VALUES
('Afriquia SMDC',  '000112223000010', '+212522111111', 'contact@afriquia.ma',  'Casablanca',        'ACTIF'),
('Garage Atlas',   '000445556000011', '+212528222222', 'atlas@garage.ma',      'Agadir',            'ACTIF'),
('Michelin Maroc', '000778889000012', '+212522333333', 'pro@michelin.ma',      'Casablanca',        'ACTIF');

-- DETTES_FOURNISSEURS (solde et date_echeance générés automatiquement)
INSERT INTO dettes_fournisseurs (numero_facture, date_facture, nom_fournisseur, categorie, delai_paiement, montant_du, montant_paye, jours_retard, statut, remarques) VALUES
('FF-AFR-2026-07', '2026-07-01', 'Afriquia SMDC',  'CARBURANT', 30, 9375.00,  9375.00, 0, 'SOLDEE',    'Carburant flotte juillet'),
('FF-ATL-2026-12', '2026-07-05', 'Garage Atlas',   'ENTRETIEN', 30, 4200.00,  1000.00, 0, 'PARTIELLE', 'Réparation freins Renault'),
('FF-MIC-2026-33', '2026-07-08', 'Michelin Maroc', 'PNEUS',     60, 24000.00, 0.00,    0, 'OUVERTE',   'Jeu de pneus x2 véhicules');

-- PAIEMENTS_FOURNISSEURS
INSERT INTO paiements_fournisseurs (numero_facture, nom_fournisseur, date_paiement, reference, montant_paye, methode_paiement, remarques) VALUES
('FF-AFR-2026-07', 'Afriquia SMDC', '2026-07-31', 'VIR-900001', 9375.00, 'VIREMENT', 'Solde intégral'),
('FF-ATL-2026-12', 'Garage Atlas',  '2026-07-06', NULL,         1000.00, 'ESPECES',  'Acompte');

-- GESTION_PAIEMENTS
INSERT INTO gestion_paiements (nom_entreprise, type_document, montant, beneficiaire, date_creation, date_echeance, jours_restants, jours_retard, statut) VALUES
('EuroMaroc Export', 'FACTURE',  26400.00, 'Notre société',  '2026-07-12', '2026-10-10', 90, 0, 'EN_ATTENTE'),
('Michelin Maroc',   'FACTURE',  24000.00, 'Michelin Maroc', '2026-07-08', '2026-09-06', 56, 0, 'EN_ATTENTE'),
('Afriquia SMDC',    'VIREMENT',  9375.00, 'Afriquia SMDC',  '2026-07-31', '2026-07-31', 0,  0, 'PAYE');

COMMIT;

-- =====================================================================
--  FIN DU SCRIPT
-- =====================================================================
