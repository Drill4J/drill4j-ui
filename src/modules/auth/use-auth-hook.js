import { useState, useEffect } from "react"
import axios from "axios"

const useAuth = () => {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/user-info")
      setUserInfo(response.data)
      setIsAuthorized(true)
    } catch (error) {
      handleAuthError(error)
    }
  }

  const handleAuthError = (error) => {
    if (error.response) {
      const status = error.response.status
      if (status >= 500) {
        setError({
          type: "server-error",
          message: `Internal server error (${status})`,
        })
      } else if (status === 404) {
        setError({ type: "not-found", message: "Resource not found (404)" })
      } else if (status === 401) {
        const errorMessage =
          error.response.data.errorMessage ||
          "You don't have the necessary permissions to access this page"
        setError({
          type: "client-error",
          message: `${errorMessage} (${status})`,
        })
      } else if (status >= 400) {
        const errorMessage =
          error.response.data.errorMessage || `Bad request or validation error`
        setError({
          type: "client-error",
          message: `${errorMessage} (${status})`,
        })
      }
    } else if (error.request) {
      setError({
        type: "network-error",
        message: "Network error, API is unavailable",
      })
    } else {
      setError({ type: "unknown-error", message: "Unknown error occurred" })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return { isAuthorized, error, userInfo, retryAuth: checkAuth }
}

export default useAuth
