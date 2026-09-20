import { useState, useEffect } from "react"
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  BarChart3,
  ShoppingCart,
} from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Liaison automatique avec le serveur au chargement de l'onglet
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const response = await fetch("http://localhost:3001/api/dashboard/stats")
        const result = await response.json()
        if (result.success) {
          setStats(result)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardStats()
  }, [])

  // Si le serveur n'a pas encore fait de calcul, on utilise des valeurs à 0 par sécurité
  // Fusion et sécurisation absolue contre les valeurs undefined ou nulles
  const currentStats = {
    valeurAchats: stats?.valeurAchats || 0,
    valeurVentes: stats?.valeurVentes || 0,
    valeurConsommation: stats?.valeurConsommation || 0,
    valeurStock: stats?.valeurStock || 0,
    volumeStock: stats?.volumeStock || 0,
    totalClients: stats?.totalClients || 0,
    referencesAvecEcart: stats?.referencesAvecEcart || 0,
    achatsLignes: stats?.achatsLignes || 0,
    achatsQte: stats?.achatsQte || 0,
    ventesLignes: stats?.ventesLignes || 0,
    ventesQte: stats?.ventesQte || 0,
    stockAntLignes: stats?.stockAntLignes || 0,
    stockAntQte: stats?.stockAntQte || 0,
    inventaireLignes: stats?.inventaireLignes || 0,
    inventaireQte: stats?.inventaireQte || 0
  };

  if (loading) {
    return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">Chargement des données réelles...</div>
  }

  return (
    <div className="w-full min-h-[600px] bg-slate-100 p-6 overflow-y-auto space-y-6">
      
      {/* En-tête du Tableau de bord */}
      <div className="bg-white border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Tableau de bord & Statistiques
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Vue consolidée des flux, des stocks et de la volumétrie Sage
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </div>
      </div>

      {/* 1. SECTION KPI CARDS (Achats, Ventes, Stock, Clients, Écarts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Carte 1 : Valeur Achats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Achats HT</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {currentStats.valeurAchats.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Flux d'achats Sage
          </div>
        </div>

        {/* Carte 2 : Valeur Ventes (NOUVEAU) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ventes HT</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {currentStats.valeurVentes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Chiffre d'affaires
          </div>
        </div>

        {/* Carte 3 : Quantité Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Stock</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {currentStats.volumeStock.toLocaleString("fr-FR")} unités
          </div>
          <p className="text-xs text-slate-400">Inventaire actuel</p>
        </div>

        {/* Carte 4 : Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Clients</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {currentStats.totalClients} actifs
          </div>
          <p className="text-xs text-slate-400">Répertoire Sage</p>
        </div>

        {/* Carte 5 : Écarts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Écarts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {currentStats.referencesAvecEcart} réf.
          </div>
          <p className="text-xs text-amber-600 font-medium">À vérifier</p>
        </div>

      </div>

      {/* 2. SECTION TABLEAUX ET GRAPHIQUES VISUELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Synthèse des flux réglementaires avec Ventes intégrées */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Synthèse des flux & Chiffres Clés DCP
            </h2>
            <span className="text-xs text-slate-400">Période active</span>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="p-3 font-semibold">Indicateur / Source</th>
                  <th className="p-3 font-semibold">Lignes</th>
                  <th className="p-3 font-semibold">Quantité</th>
                  <th className="p-3 font-semibold text-right">Valeur Globale (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" /> État des Achats Sage
                  </td>
                  <td className="p-3">{currentStats.achatsLignes}</td>
                  <td className="p-3">{currentStats.achatsQte.toLocaleString("fr-FR")}</td>
                  <td className="p-3 text-right font-semibold">{currentStats.valeurAchats.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</td>
                </tr>
                {/* Ligne Ventes ajoutée dans le tableau */}
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" /> État des Ventes Globales
                  </td>
                  <td className="p-3">{currentStats.ventesLignes}</td>
                  <td className="p-3">{currentStats.ventesQte.toLocaleString("fr-FR")}</td>
                  <td className="p-3 text-right font-semibold text-emerald-700">{currentStats.valeurVentes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" /> Inventaire Actuel & Stock
                  </td>
                  <td className="p-3">{currentStats.inventaireLignes}</td>
                  <td className="p-3">{currentStats.inventaireLignes > 0 ? currentStats.inventaireQte.toLocaleString("fr-FR") : "-"}</td>
                  <td className="p-3 text-right font-semibold">{currentStats.valeurStock?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) || "0,00"} DA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bloc GRAPHIQUE VISUEL DES FLUX */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Répartition des Valeurs
          </h2>
          
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Ventes HT</span>
                <span className="text-emerald-600">{(currentStats.valeurVentes / 1000000).toFixed(1)}M DA</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Achats HT</span>
                <span className="text-blue-600">{(currentStats.valeurAchats / 1000000).toFixed(1)}M DA</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "70%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Valeur Stock</span>
                <span className="text-purple-600">{(currentStats.valeurStock ? (currentStats.valeurStock / 1000000).toFixed(1) : "0.0")}M DA</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: currentStats.valeurStock > 0 ? "45%" : "0%" }}></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            * Indicateurs calculés automatiquement depuis les bases Sage et SQLite.
          </div>        
        </div>

        {/* NOUVEAUX INDICATEURS EN LIGNE AVEC ICÔNES */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-4">
          {/* Consommation */}
          <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-200/60 text-slate-600 rounded-lg">
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Consommation</span>
            </div>
            <span className="text-xs font-bold text-slate-900">{currentStats.valeurConsommation.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</span>
          </div>

          {/* Bénéfice brut */}
          <div className="px-4 py-2.5 bg-emerald-50/30 border border-emerald-100/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Bénéfice Brut</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">{(currentStats.valeurVentes - currentStats.valeurConsommation).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</span>
          </div>

          {/* Marge Moyenne */}
          <div className="px-4 py-2.5 bg-indigo-50/40 border border-indigo-100/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Marge Moyenne</span>
            </div>
            <span className="text-xs font-bold text-indigo-700">{(currentStats.valeurVentes > 0 ? ((currentStats.valeurVentes - currentStats.valeurConsommation) / currentStats.valeurVentes) * 100 : 0).toFixed(2)} %</span>
          </div>
        </div>

      </div>

    </div>
  )
}

