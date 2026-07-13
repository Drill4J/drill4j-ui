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

/**
 * @param {string[] | undefined} params
 */
export function formatMethodParams(params) {
  if (!params?.length) {
    return "—"
  }

  const normalized = params.filter((param) => param != null && param !== "")
  if (!normalized.length) {
    return "—"
  }

  if (normalized.length === 1 && normalized[0] === "()") {
    return "()"
  }

  return `(${normalized.join(", ")})`
}

/**
 * @param {string | null | undefined} returnType
 */
export function formatReturnType(returnType) {
  if (returnType == null || returnType === "") {
    return "—"
  }
  return returnType
}

export const METHOD_PARAMS_COLUMN = {
  title: "Params",
  key: "params",
  ellipsis: true,
  render: (_, row) => formatMethodParams(row.params),
}

export const METHOD_RETURN_TYPE_COLUMN = {
  title: "Return type",
  key: "returnType",
  width: 140,
  ellipsis: true,
  render: (_, row) => formatReturnType(row.returnType),
}
