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
        .some((role) => role === userInfo?.role.toLowerCase())
    )

    if (!hasRole) {
      setError("You don't have necessary role to access this resource")
    }
  }, [isSignedIn, userInfo, allowedRoles])

  return { hasRole, error }
}

export default useCheckRole
