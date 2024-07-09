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
import { useState, useEffect, createContext, useContext } from "react"
import axios from "axios"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [isFetched, setIsFetched] = useState(false)

  const checkAuth = async () => {
    try {
      // It's not worth using getUserInfo() wrapper, since we need axios response/status/request objects 
      const response = await axios.get("/api/user-info")
      setUserInfo(response.data.data)
      setIsSignedIn(true)
    } catch (error) {
      handleAuthError(error)
    }
    setIsFetched(true)
  }

  const handleAuthError = (error) => {
    if (error.response) {
      const status = error.response.status
      if (status >= 500) {
        setError(`Internal server error (${status})`)
      } else if (status === 404) {
        setError("Resource not found (404)")
      } else if (status === 401) {
        setIsSignedIn(false)
      } else if (status >= 400) {
        setError(
          `${
            error.response.data.errorMessage ||
            `Bad request or validation error`
          } (${status})`
        )
      }
    } else if (error.request) {
      setError("Network error, API is unavailable")
    } else {
      setError("Unknown error occurred")
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{ isFetched, isSignedIn, error, userInfo }}
    >
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)
export default useAuth
