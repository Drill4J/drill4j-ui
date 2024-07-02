import { useEffect } from "react"
import useAuth from "./use-auth-hook"

const useCheckRole = (requiredRole) => {
  const { isAuthorized, error, userInfo, retryAuth } = useAuth()

  useEffect(() => {
    if (isAuthorized && userInfo) {
      checkRole(userInfo, requiredRole)
    }
  }, [isAuthorized, userInfo, requiredRole])

  const checkRole = (userInfo, requiredRole) => {
    const userRole = userInfo.role
    if (userRole === requiredRole) {
      console.log(`User is authorized with role: ${requiredRole}`)
    } else {
      console.log(`User is not authorized with role: ${requiredRole}`)
    }
  }

  return { isAuthorized, error, retryAuth }
}

export default useCheckRole
