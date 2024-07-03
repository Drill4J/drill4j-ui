import { useEffect, useState } from "react"
import useAuth from "./use-auth-hook"

const useCheckRole = (allowedRoles) => {
  const { isSignedIn, userInfo } = useAuth()
  
  const [ error, setError] = useState(null)
  const [ hasRole, setHasRole ] = useState(null)

  useEffect(() => {
    if (isSignedIn && userInfo) {
      checkRole(userInfo, allowedRoles)
    }
  }, [isSignedIn, userInfo, allowedRoles])

  const checkRole = (userInfo, allowedRoles) => {
    const userRole = userInfo?.data.role
    if (allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase())) {
      setHasRole(true)
    } else {
      setHasRole(false)
      setError(`You don't have necessary role to access this resource`)
    }
  }

  return { hasRole, error }
}

export default useCheckRole
