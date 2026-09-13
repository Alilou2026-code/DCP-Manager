import Database from 'better-sqlite3'
import path from 'node:path'

const dbPath = path.join(process.cwd(), 'dcp-manager.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

// Création de la table Clients
db.exec(`
  CREATE TABLE IF NOT EXISTS Clients (
    IdClt INTEGER PRIMARY KEY AUTOINCREMENT,
    Code TEXT,
    RaisonSociale TEXT,
    RCN TEXT,
    Ville TEXT,
    Adresse TEXT
  )
`)

// Création de la table Inventaire
db.exec(`
  CREATE TABLE IF NOT EXISTS Inventaire (
    IdArt INTEGER PRIMARY KEY AUTOINCREMENT,
    Reference TEXT,
    Designation TEXT,
    QtesEnStock REAL,
    PRUnitHT REAL,
    MtnDRHT REAL
  )
`)

// Création de la table EtatVentesDCP
db.exec(`
  CREATE TABLE IF NOT EXISTS EtatVentesDCP (
    IdEtatV INTEGER PRIMARY KEY AUTOINCREMENT,
    RaisonSociale TEXT,
    RCN TEXT,
    Ville TEXT,
    Adresse TEXT,
    Reference TEXT,
    Designation TEXT,
    QtesVendues REAL,
    MtnVentesHT REAL,
    FactureN TEXT,
    Observations TEXT
  )
`)

// Création de la table EtatStockDCP
db.exec(`
  CREATE TABLE IF NOT EXISTS EtatStockDCP (
    IdEtatS INTEGER PRIMARY KEY AUTOINCREMENT,
    Reference TEXT,
    Designation TEXT,
    DateImport TEXT,
    QtesImport REAL,
    ValeurDRHT REAL,
    QtesVendues REAL,
    ResteEnStock REAL,
    Observations TEXT
  )
`)

export default db