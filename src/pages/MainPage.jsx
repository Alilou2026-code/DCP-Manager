import { useState } from "react"

import MenuBar from "@/components/MenuBar"
import TitleBar from "@/components/TitleBar"
import Sidebar from "@/components/Sidebar"
import MainTabs from "@/components/MainTabs"
import StatusBar from "@/components/StatusBar"

function MainPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("intui")

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#eef0f2] text-[#30373b]">

      {/* Barre de menus */}
      <MenuBar />

      {/* Barre de titre */}
      <TitleBar />

      {/* Corps principal */}
      <div className="flex min-h-0 flex-1">

        {/* Volet gauche */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onSelect={setActiveTab}
        />

        {/* Zone centrale */}
        <main className="flex min-w-0 flex-1 flex-col">

          <MainTabs
            activeTab={activeTab}
            onChange={setActiveTab}
          />

        </main>

      </div>

      {/* Barre d'état */}
      <StatusBar />

    </div>
  )
}

export default MainPage