import React, { createContext, useContext, useState, useEffect } from "react"
import { getAuthConfig } from "../api-auth"

const AuthConfigContext = createContext()

export const AuthConfigProvider = ({ children }) => {
  const [authConfig, setAuthConfig] = useState(null)
  const [isFetched, setIsFetched] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAuthConfig() {
      try {
        const authConfig = await getAuthConfig()
        setAuthConfig(authConfig)
      } catch (error) {
        console.error("Error fetching UI configuration:", error)
        setError(error)
      }
      setIsFetched(true)
    }

    fetchAuthConfig()
  }, [])

  return (
    <AuthConfigContext.Provider value={{ authConfig, isFetched, error }}>
      {children}
    </AuthConfigContext.Provider>
  )
}

export const useAuthConfig = () => {
  return useContext(AuthConfigContext)
}
