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
 * @typedef {Object} EditUserPayload
 * @property {Role} role - The role of the user.
 */

/**
 * Fetches the list of users.
 * @returns {Promise<any[]>} A promise that resolves to an array of users.
 */
export async function getUsers() {
  const response = await runCatching(axios.get("/api/users"))
  return response.data.data
}

/**
 * Edits a user with the given payload.
 * @param {number} id - The ID of the user to edit.
 * @param {EditUserPayload} editUserPayload - The payload containing user details to be edited.
 * @returns {Promise<string>} A promise that resolves to a success message.
 */
export async function editUser(id, editUserPayload) {
  const response = await runCatching(axios.put(`/api/users/${id}`, editUserPayload))
  return response.data.message
}

/**
 * Fetches a user by ID.
 * @param {number} id - The ID of the user to fetch.
 * @returns {Promise<any>} A promise that resolves to the user data.
 */
export async function getUserById(id) {
  const response = await runCatching(axios.get(`/api/users/${id}`))
  return response.data
}

/**
 * Deletes a user by ID.
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<string>} A promise that resolves to a success message.
 */
export async function deleteUser(id) {
  const response = await runCatching(axios.delete(`/api/users/${id}`))
  return response.data.message
}

/**
 * Blocks a user by ID.
 * @param {number} id - The ID of the user to block.
 * @returns {Promise<string>} A promise that resolves to a success message.
 */
export async function blockUser(id) {
  const response = await runCatching(axios.patch(`/api/users/${id}/block`))
  return response.data.message
}

/**
 * Unblocks a user by ID.
 * @param {number} id - The ID of the user to unblock.
 * @returns {Promise<string>} A promise that resolves to a success message.
 */
export async function unblockUser(id) {
  const response = await runCatching(axios.patch(`/api/users/${id}/unblock`))
  return response.data.message
}

/**
 * Resets a user's password by ID.
 * @param {number} id - The ID of the user to reset the password for.
 * @returns {Promise<PasswordResetResponse>} A promise that resolves to the password reset response.
 */
export async function resetPassword(id) {
  const response = await runCatching(axios.patch(`/api/users/${id}/reset-password`))
  return response.data
}

/**
 * @typedef {Object} PasswordResetResponse
 * @property {Object} data - The data object containing the new password.
 * @property {string} data.password - The new password.
 * @property {string} message - The success message.
 */
