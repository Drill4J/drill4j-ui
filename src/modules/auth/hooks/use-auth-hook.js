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
import { useImmer } from "use-immer"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [state, updateState] = useImmer({
    isSignedIn: false,
    error: null,
    userInfo: null,
    isFetched: false
  })

  const checkAuth = async () => {
    try {
      // It's not worth using getUserInfo() wrapper, since we need axios response/status/request objects 
      debugger
      const response = await axios.get("/api/user-info")
      updateState((draft) => {
        draft.userInfo = response.data.data
        draft.isSignedIn = true,
        draft.isFetched = true
      })
    } catch (error) {
      handleAuthError(error)
    }
  }

  const handleAuthError = (error) => {
    updateState((draft) => {
      draft.isFetched = true
      if (error.response) {
        const status = error.response.status
        if (status >= 500) {
          draft.error = `Internal server error (${status})`
        } else if (status === 404) {
          draft.error = "Resource not found (404)"
        } else if (status === 401) {
          draft.isSignedIn = false
        } else if (status >= 400) {
          draft.error =
            error.response.data.errorMessage ||
            `Bad request or validation error (${status})`
        }
      } else if (error.request) {
        draft.error = "Network error, API is unavailable"
      } else {
        draft.error = "Unknown error occurred"
      }
    })
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)
export default useAuth
