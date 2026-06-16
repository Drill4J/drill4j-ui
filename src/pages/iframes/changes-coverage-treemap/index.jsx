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
import { Col, Divider, Row } from "antd"
import { CoverageTreemapCanvas } from "../../../components/charts/treemap-canvas"

export const ChangesCoverageTreemapPage = () => (
  <>
    <Row>
      <Col span={24}>
        <CoverageTreemapCanvas
          apiEndpoint={"/metrics/changes-coverage-treemap"}
          queryParams={[
            "buildId",
            "baselineBuildId",
            "testTag",
            "envId",
            "branch",
            "packageNamePattern",
            "classNamePattern",
            "includeDeleted",
            "includeEqual",
          ]}
        />
      </Col>
    </Row>
  </>
)
