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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Prefill classname/name patterns for "Generate exclusion rule" from a treemap/table node.
 * @param {{ type: string, package_name?: string, class_name?: string, method_name?: string }} node
 */
export function generateExclusionRuleFromNode(node) {
  if (!node?.type) {
    return { classnamePattern: undefined, namePattern: undefined }
  }
  if (node.type === "package") {
    const packageName = node.package_name
    return {
      classnamePattern:
        packageName != null && packageName !== ""
          ? `^${escapeRegex(packageName)}/.*`
          : ".*",
      namePattern: undefined,
    }
  }
  if (node.type === "class") {
    return {
      classnamePattern:
        node.class_name != null ? `^${escapeRegex(node.class_name)}$` : undefined,
      namePattern: undefined,
    }
  }
  if (node.type === "method") {
    return {
      classnamePattern:
        node.class_name != null ? `^${escapeRegex(node.class_name)}$` : undefined,
      namePattern:
        node.method_name != null ? `^${escapeRegex(node.method_name)}$` : undefined,
    }
  }
  return { classnamePattern: undefined, namePattern: undefined }
}
