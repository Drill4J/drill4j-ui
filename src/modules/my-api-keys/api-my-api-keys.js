/*
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
 * Fetches user keys from the server.
 * @returns {Promise<Array<any>>} The list of user keys.
 */
export async function getKeys() {
  const response = await runCatching(axios.get("/user-keys"))
  return response.data.data
}

/**
 * Deletes a user key by ID.
 * @param {number} id The ID of the key to delete.
 * @returns {Promise<string>} A message indicating the success or failure of the operation.
 */
export async function deleteKey(id) {
  const response = await runCatching(axios.delete(`/user-keys/${id}`))
  return response.data.message
}

/**
 * Generates a new API key with the specified payload.
 * @param {GenerateApiKeyPayload} payload The payload containing description and expiry period.
 * @returns {Promise<any>} The response data from the server.
 */
export async function generateKey(payload) {
  const response = await runCatching(axios.post("/user-keys", payload))
  return response.data
}

/**
 * Payload format for generating a new API key.
 * @typedef {Object} GenerateApiKeyPayload
 * @property {string} description Description for the new API key.
 * @property {ExpiryPeriodEnum} expiryPeriod Expiry period for the new API key.
 */

/**
 * Enum for defining expiry periods for API keys.
 * @readonly
 * @enum {string}
 */
export const ExpiryPeriodEnum = {
  ONE_MONTH: "ONE_MONTH",
  THREE_MONTHS: "THREE_MONTHS",
  SIX_MONTHS: "SIX_MONTHS",
  ONE_YEAR: "ONE_YEAR",
}
