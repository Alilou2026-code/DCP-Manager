import { useState } from "react"
import MainPage from "@/pages/MainPage"

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <MainPage 
      isCollapsed={isCollapsed} 
      toggleCollapse={toggleCollapse} 
    />
  )
}

export default App