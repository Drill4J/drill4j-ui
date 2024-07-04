import { useEffect, useState } from "react"
import useAuth from "./use-auth-hook"

const useCheckRole = (allowedRoles) => {
  const { isSignedIn, userInfo } = useAuth()
  
  const [ error, setError] = useState(null)
  const [ hasRole, setHasRole ] = useState(null)

  useEffect(() => {
    if (!(isSignedIn && userInfo)) return

    setHasRole(
      allowedRoles
        .map((role) => role.toLowerCase())
        .some((role) => role === userInfo?.data.role.toLowerCase())
    )

    if (!hasRole) {
      setError("You don't have necessary role to access this resource")
    }
  }, [isSignedIn, userInfo, allowedRoles])

  return { hasRole, error }
}

export default useCheckRole
