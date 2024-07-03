import { useState, useEffect, createContext, useContext } from "react"
import axios from "axios"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/user-info")
      setUserInfo(response.data)
      setIsSignedIn(true)
    } catch (error) {
      handleAuthError(error)
    }
  }

  const handleAuthError = (error) => {
    if (error.response) {
      const status = error.response.status
      if (status >= 500) {
        setError(`Internal server error (${status})`)
      } else if (status === 404) {
        setError("Resource not found (404)")
      } else if (status === 401) {
        setError(
          error.response.data.errorMessage ||
            "You don't have the necessary permissions to access this page"
        )
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
      value={{ isSignedIn: isSignedIn, error, userInfo }}
    >
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)
export default useAuth
