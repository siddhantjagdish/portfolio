import { createContext, useContext, useState } from 'react'
import { initialHoldings } from './data/schemes.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [search, setSearch] = useState('')
  const [compareIds, setCompareIds] = useState(['platina', 'sterling'])
  const [holdings, setHoldings] = useState(initialHoldings)
  const [pendingOrders, setPendingOrders] = useState([])
  const [investScheme, setInvestScheme] = useState(null) // scheme object or null

  const toggleCompare = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 3 ? ids : [...ids, id]))

  const placeOrder = (order) => setPendingOrders((o) => [order, ...o])

  return (
    <AppContext.Provider
      value={{
        search,
        setSearch,
        compareIds,
        toggleCompare,
        holdings,
        setHoldings,
        pendingOrders,
        placeOrder,
        investScheme,
        setInvestScheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
