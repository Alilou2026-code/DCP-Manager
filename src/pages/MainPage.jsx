import { useState } from "react"

import MenuBar from "@/components/MenuBar"
import TitleBar from "@/components/TitleBar"
import Sidebar from "@/components/Sidebar"
import MainTabs from "@/components/MainTabs"
import StatusBar from "@/components/StatusBar"

function MainPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // On met "accueil" par défaut pour que l'app s'ouvre directement sur la page d'accueil
  const [activeTab, setActiveTab] = useState("accueil")

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-white text-[#30373b]">

      {/* Barre de menus */}
      <MenuBar />

      {/* Barre de titre */}
      <TitleBar />

      {/* Corps principal */}
      <div className="flex min-h-0 flex-1">

        {/* Volet gauche */}
        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Zone centrale */}
        <main className="flex min-w-0 flex-1 flex-col">
          <MainTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            onNavigate={setActiveTab}
          />
        </main>

      </div>

      {/* Barre d'état */}
      <StatusBar />

    </div>
  )
}

export default MainPage