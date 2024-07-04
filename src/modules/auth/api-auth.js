/*
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
import axios from "axios"
import { runCatching } from "../util"

/**
 * @typedef {Object} OAuth2ConfigView
 * @property {boolean} enabled
 * @property {string} buttonTitle
 * @property {boolean} automaticSignIn
 */

/**
 * @typedef {Object} SimpleAuthConfigView
 * @property {boolean} enabled
 * @property {boolean} signUpEnabled
 */

/**
 * @typedef {Object} AuthConfigView
 * @property {SimpleAuthConfigView} simpleAuth
 * @property {OAuth2ConfigView} oauth2
 */

/**
 * @typedef {Object} UiConfig
 * @property {AuthConfigView} auth
 */

/**
 * Signs in the user.
 * @param {Object} loginPayload - The login payload.
 * @param {string} loginPayload.username - The username.
 * @param {string} loginPayload.password - The password.
 * @returns {Promise<string>} The message from the server.
 */
export async function signIn(loginPayload) {
  const response = await runCatching(axios.post("/api/sign-in", loginPayload))
  return response.data.message
}

/**
 * Signs up a new user.
 * @param {Object} registrationPayload - The registration payload.
 * @param {string} registrationPayload.username - The username.
 * @param {string} registrationPayload.password - The password.
 * @returns {Promise<string>} The message from the server.
 */
export async function signUp(registrationPayload) {
  const response = await runCatching(
    axios.post("/api/sign-up", registrationPayload)
  )
  return response.data.message
}

/**
 * Signs out the currently authenticated user.
 * @returns {Promise<string>} The message from the server.
 */
export async function signOut() {
  const response = await runCatching(axios.post("/api/sign-out"))
  return response.data.message
}

/**
 * Updates the user's password.
 * @param {Object} changePasswordPayload - The change password payload.
 * @param {string} changePasswordPayload.oldPassword - The old password.
 * @param {string} changePasswordPayload.newPassword - The new password.
 * @returns {Promise<string>} The message from the server.
 */
export async function updatePassword(changePasswordPayload) {
  const response = await runCatching(
    axios.post("/api/update-password", changePasswordPayload)
  )
  return response.data.message
}

/**
 * Retrieves information about the currently authenticated user.
 * @returns {Promise<UserInfo|null>} The user information or null if not authenticated.
 */
export async function getUserInfo() {
  const response = await runCatching(axios.get("/api/user-info"))
  return response.data.data
}

/**
 * Retrieves the UI configuration related to authentication.
 * @returns {Promise<UiConfig|null>} The UI configuration or null if not available.
 */
export async function getUiConfig() {
  const response = await runCatching(axios.get("/api/ui-config"))
  return response.data.data?.auth
}
