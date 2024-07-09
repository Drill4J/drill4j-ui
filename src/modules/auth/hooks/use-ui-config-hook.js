/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
