export interface Personne {
  matricule: string;
  nom: string;
  prenom: string;
  tel?: string;
  email: string;
  poste: string;
  projet: string;
}

export interface Materiel {
  numSerie: string;
  marque: string;
  modele: string;
  categorie: string;
  status: string;
  dateAjout?: string;
  uc?: {
    nomPC: string;
    systemeExploitation: string;
    ram: string;
    disque: string;
    processeur: string;
  };
  refAffectation?: string;
  refPosition?: string;
  refIncident?: string;
}

export interface Position {
  refPosition: string;
  designPosition: string;
  port: string;
  occupation: string;
  refSalle: string;
}

export interface Affectation {
  refAffectation: number;
  refPosition: string;
  materiels: Materiel[];
  dateDebut: string;
  dateFin?: string;
  matricule: string;
  prenom: string;
  status?: 'Active' | 'Closed';
}

export interface Inventaire {
  refInventaire: number;
  date: string;
  debut?: string;
  fin?: string;
  observation?: string;
  refSalle: string;
  matricule: string;
  salle?: {
    nomSalle: string;
    etage: string;
    site: string;
  };
  personne?: {
    nom: string;
    prenom: string;
  };
  materiels?: Materiel[];
}

export interface Salle {
  refSalle: string;
  nomSalle: string;
  etage: string;
  site: string;
}

export interface Incident {
  refIncident: number;
  refInventaire: string;
  typeIncident: string;
  numSerie: string;
  statutIncident: string;
  dateInc: string;
  matricule: string;
  description: string;
  personne?: {
    nom: string;
    prenom: string;
  };
  materiel?: {
    marque: string;
    modele: string;
  };
  inventaire?: {
    date: string;
  };
}

export interface Utilisateur {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  isActive: boolean;
}

// Additional types for forms and modals
export interface Poste {
  id: string;
  nom: string;
}

export interface Projet {
  refProjet: string;
  nomProjet: string;
}

export interface AssetGroup {
  categorie: string;
  materiels: Materiel[];
}

export interface MaterielCount {
  categorie: string;
  count: number;
  confirmed: boolean;
}
