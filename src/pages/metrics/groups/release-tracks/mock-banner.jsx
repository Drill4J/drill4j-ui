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
import { Alert } from "antd"

export function MilestoneMockBanner() {
  return (
    <Alert
      className="release-tracks-mock-banner"
      type="warning"
      showIcon
      message="UI mock"
      description="These pages are a layout sketch. They use static data and are not connected to the admin API."
    />
  )
}
