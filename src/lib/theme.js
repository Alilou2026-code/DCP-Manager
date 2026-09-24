// ============================================================
// DCP MANAGER — GESTION DU THÈME (CLAIR / SOMBRE / AUTOMATIQUE)
//
// Le choix est conservé dans le stockage local du navigateur
// intégré (persiste entre les lancements de l'application).
// "system" suit le thème actuel de Windows et se met à jour
// automatiquement si l'utilisateur change de thème sans relancer
// l'application.
// ============================================================

const STORAGE_KEY = "dcp-manager-theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

function resolveEffectiveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
  }
  return theme
}

// Synchronise, quand elle est disponible, la barre de titre native
// Windows (et les décorations système) avec le thème choisi.
function syncNativeTheme(theme) {
  if (
    window.electronAPI &&
    typeof window.electronAPI.setNativeTheme === "function"
  ) {
    window.electronAPI.setNativeTheme(theme)
  }
}

export function applyTheme(theme) {
  const effective = resolveEffectiveTheme(theme)
  document.documentElement.classList.toggle("dark", effective === "dark")
  syncNativeTheme(theme)
}

export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // Stockage local indisponible : on retombe sur "system"
  }
  return "system"
}

export function setTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Stockage local indisponible : le thème reste actif pour cette session
  }
  applyTheme(theme)
}

let systemListenerAttached = false

// À appeler une seule fois, le plus tôt possible (avant le premier rendu),
// pour éviter un flash de thème clair au démarrage.
export function initTheme() {
  applyTheme(getStoredTheme())

  if (!systemListenerAttached) {
    systemListenerAttached = true

    const media = window.matchMedia(MEDIA_QUERY)
    const handler = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system")
      }
    }

    if (media.addEventListener) {
      media.addEventListener("change", handler)
    } else if (media.addListener) {
      // Compatibilité avec les anciens moteurs Chromium
      media.addListener(handler)
    }
  }
}
