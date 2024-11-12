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

import axios from "axios";
import { runCatching } from "../util";

/**
 * Fetches keys from the server.
 * @returns {Promise<any>} A promise that resolves with the fetched keys.
 */
export async function getKeys() {
  const response = await runCatching(axios.get("/keys"));
  return response.data.data;
}

/**
 * Deletes a key from the server.
 * @param {number} id The ID of the key to delete.
 * @returns {Promise<string>} A promise that resolves with a message indicating the deletion status.
 */
export async function deleteKey(id) {
  const response = await runCatching(axios.delete(`/keys/${id}`));
  return response.data.message;
}
