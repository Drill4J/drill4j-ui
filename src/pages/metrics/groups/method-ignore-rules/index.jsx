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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Button,
  Form,
  Input,
  Menu,
  Modal,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd"
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons"
import axios from "axios"
import { useParams, useSearchParams } from "react-router-dom"
import { IgnoreRulesTreemap } from "../../../../components/charts/treemap-canvas"
import useAuth from "../../../../modules/auth/hooks/use-auth-hook"
import * as MetricsAPI from "../../../../modules/metrics/api-metrics"
import * as API from "../../../../modules/method-ignore-rules/api-method-ignore-rules"
import {
  CatalogBuildFilter,
  CatalogBuildPickerDialog,
} from "../../../../modules/method-ignore-rules/catalog-build-select"
import { generateExclusionRuleFromNode } from "../../../../modules/method-ignore-rules/exclusion-rule-generator"
import { RawMethodsPackageTree } from "./raw-methods-package-tree"

const { Link, Text, Title } = Typography
const PATTERN_FIELDS = [
  ["classnamePattern", "Class name regex"],
  ["namePattern", "Method name regex"],
]
const EXCLUSION_ACTION_LABEL = "Generate exclusion rule"
const RULES_PAGE_SIZE = 20
const BUILDS_PAGE_SIZE = 8
const METRICS_REFRESH_SWAGGER_URL = `${new URL(
  axios.defaults.baseURL || "/api",
  window.location.href
).origin}/swagger#operations-metrics-refreshMetrics`

const RegexExample = ({ children }) => (
  <code
    style={{
      fontFamily: "Courier New, Courier, monospace",
      background: "rgba(255, 255, 255, 0.12)",
      padding: "1px 5px",
      borderRadius: 3,
      fontSize: 12,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </code>
)

const TITLE_HELP_ICON_STYLE = {
  color: "rgba(0, 0, 0, 0.45)",
  marginLeft: 8,
  fontSize: 14,
  verticalAlign: "middle",
  cursor: "help",
}

const TitleHelpTooltip = ({ title, ariaLabel }) => (
  <Tooltip
    title={title}
    placement="bottomLeft"
    mouseEnterDelay={0.15}
    mouseLeaveDelay={0.35}
    overlayStyle={{ maxWidth: 540 }}
  >
    <InfoCircleOutlined aria-label={ariaLabel} style={TITLE_HELP_ICON_STYLE} />
  </Tooltip>
)

const EXCLUSION_RULES_HELP = (
  <div style={{ width: 500, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Rules are regular expressions used to match <i>methods</i>, either by class name or by method name.
 
    </p>
    <p style={{ margin: "0 0 12px" }}>
      Rule changes apply <b>to new builds only</b>. To apply rules to earlier
      builds, recalculate metrics via{" "}
      <Link
        href={METRICS_REFRESH_SWAGGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#91caff" }}
      >
        POST /api/metrics/refresh
      </Link>
      .
    </p>
    <div style={{ fontWeight: 600, marginBottom: 6 }}>Examples</div>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        To exclude all methods in a package — set a classname pattern that
        matches the package path (package is part of the class name), e.g.{" "}
        <RegexExample>^com/example/.*</RegexExample>
      </li>
      <li style={{ marginBottom: 8 }}>
        To exclude all methods in a class — set a classname pattern, e.g.{" "}
        <RegexExample>^com/example/MyService$</RegexExample>
      </li>
      <li style={{ marginBottom: 8 }}>
        To exclude a method by name in any class or package — set a method name
        pattern, e.g. <RegexExample>^toString$</RegexExample> or{" "}
        <RegexExample>^get.*</RegexExample>
      </li>
      <li>
        To exclude a specific method in a specific class — set both classname
        and method name patterns (combined with AND), e.g. classname{" "}
        <RegexExample>^com/example/MyService$</RegexExample> and name{" "}
        <RegexExample>^process$</RegexExample>
      </li>
    </ul>
  </div>
)

const APP_STRUCTURE_HELP = (
  <div style={{ width: 420, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Interactive treemap of packages, classes, and methods for the selected
      build. Tile size reflects method count; colors show excluded methods.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        <b>Click</b> a package or class to drill into it. Use the breadcrumbs
        above the map to go back up.
      </li>
      <li style={{ marginBottom: 8 }}>
        Use <b>max depth</b> control to set the depth of the treemap.
      </li>
      <li>
        <b>Right-click</b> a package, class, or method to{" "}
        <b>Generate exclusion rule</b> — generate pattern for the selected element.
      </li>
    </ul>
  </div>
)

const PACKAGE_TREE_HELP = (
  <div style={{ width: 420, lineHeight: 1.55 }}>
    <p style={{ margin: "0 0 8px" }}>
      Nested tables of packages → classes → methods.
      Excluded methods stay visible and are highlighted.
    </p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li style={{ marginBottom: 8 }}>
        Expand package rows for nested packages. Use{" "}
        <b>N classes (show)</b> / <b>N methods (show)</b> to open classes and
        load methods.
      </li>
      <li>
        <b>Right-click</b> a package, class, or method row — or use the row
        actions menu — to <b>Generate exclusion rule</b> with prefilled
        patterns.
      </li>
    </ul>
  </div>
)

const regexValidator = (_, value) => {
  if (!value) return Promise.resolve()
  try {
    new RegExp(value)
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(new Error(error.message))
  }
}

export const MethodIgnoreRulesPage = () => {
  const { groupId, appId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const buildId = searchParams.get("buildId") || undefined
  const { isAdmin } = useAuth()
  const [form] = Form.useForm()
  const [rules, setRules] = useState([])
  const [rulesPage, setRulesPage] = useState(1)
  const [rulesTotal, setRulesTotal] = useState(0)
  const [builds, setBuilds] = useState([])
  const [buildsPage, setBuildsPage] = useState(1)
  const [buildsTotal, setBuildsTotal] = useState(0)
  const [buildsLoading, setBuildsLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedBuild, setSelectedBuild] = useState(null)
  const [treeData, setTreeData] = useState([])
  const [affectedMethods, setAffectedMethods] = useState(0)
  const [totalMethods, setTotalMethods] = useState(0)
  const [loadingRules, setLoadingRules] = useState(true)
  const [loadingTree, setLoadingTree] = useState(false)
  const [editing, setEditing] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [formScrollToken, setFormScrollToken] = useState(0)
  const exclusionFormRef = useRef(null)

  useEffect(() => {
    if (!editing || formScrollToken === 0) {
      return
    }
    exclusionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [editing, formScrollToken])

  const setBuildId = useCallback(
    (selectedBuildId) => {
      const updatedSearchParams = new URLSearchParams(searchParams)
      if (selectedBuildId) {
        updatedSearchParams.set("buildId", selectedBuildId)
      } else {
        updatedSearchParams.delete("buildId")
      }
      setSearchParams(updatedSearchParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const loadRules = useCallback(async () => {
    setLoadingRules(true)
    try {
      const result = await API.getRules(groupId, appId, rulesPage, RULES_PAGE_SIZE)
      if (!Array.isArray(result.data)) {
        throw new Error("Invalid rules response: data must be an array")
      }
      setRules(result.data)
      setRulesTotal(result.total)
    } catch (error) {
      message.error(`Failed to load exclusion rules. ${error.message}`)
    } finally {
      setLoadingRules(false)
    }
  }, [appId, groupId, rulesPage])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const loadBuilds = useCallback(
    async (page) => {
      setBuildsLoading(true)
      try {
        const { data, paging } = await MetricsAPI.getBuilds({
          groupId,
          appId,
          page,
          pageSize: BUILDS_PAGE_SIZE,
        })
        if (!Array.isArray(data)) {
          throw new Error("Invalid builds response: data must be an array")
        }
        setBuilds(
          data.map((build) => ({
            buildId: build.id,
            buildVersion: build.buildVersion,
            branch: build.branch,
          }))
        )
        setBuildsTotal(paging.total)
        setBuildsPage(page)
      } catch (error) {
        message.error(`Failed to load builds. ${error.message}`)
      } finally {
        setBuildsLoading(false)
      }
    },
    [appId, groupId]
  )

  useEffect(() => {
    if (!pickerOpen) {
      return
    }
    loadBuilds(1)
  }, [loadBuilds, pickerOpen])

  useEffect(() => {
    if (!buildId) {
      setSelectedBuild(null)
      return
    }
    setSelectedBuild((current) => {
      if (current?.buildId === buildId) {
        return current
      }
      return { buildId }
    })
  }, [buildId])

  const treeRequestIdRef = useRef(0)

  const loadTree = useCallback(async () => {
    if (!buildId) {
      return
    }
    const requestId = ++treeRequestIdRef.current
    setLoadingTree(true)
    try {
      const tree = await API.getTree(groupId, appId, buildId)
      if (requestId !== treeRequestIdRef.current) {
        return
      }
      if (!Array.isArray(tree.roots)) {
        throw new Error("Invalid tree response: roots must be an array")
      }
      setTreeData(tree.roots)
      setAffectedMethods(tree.affectedMethods)
      setTotalMethods(tree.totalMethods)
    } catch (error) {
      if (requestId !== treeRequestIdRef.current) {
        return
      }
      message.error(`Failed to load raw method hierarchy. ${error.message}`)
    } finally {
      if (requestId === treeRequestIdRef.current) {
        setLoadingTree(false)
      }
    }
  }, [appId, buildId, groupId])

  useEffect(() => {
    if (!buildId) {
      treeRequestIdRef.current += 1
      setTreeData([])
      setAffectedMethods(0)
      setTotalMethods(0)
      setLoadingTree(false)
      return
    }
    loadTree()
  }, [buildId, loadTree])

  const openExclusionForm = useCallback(
    (node) => {
      if (!isAdmin) {
        message.warning("Creating exclusion rules requires ADMIN role")
        return
      }
      const draft = generateExclusionRuleFromNode(node)
      setEditing(true)
      setFormScrollToken((token) => token + 1)
      form.resetFields()
      form.setFieldsValue({
        classnamePattern: draft.classnamePattern,
        namePattern: draft.namePattern,
      })
      setContextMenu(null)
    },
    [form, isAdmin]
  )

  const handleNodeContextMenu = useCallback((node, event) => {
    setContextMenu({
      node,
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      await API.createRule({
        groupId,
        appId,
        classnamePattern: values.classnamePattern || undefined,
        namePattern: values.namePattern || undefined,
      })
      message.success("Exclusion rule saved")
      setEditing(false)
      form.resetFields()
      if (rulesPage !== 1) {
        setRulesPage(1)
      } else {
        await loadRules()
      }
      await loadTree()
    } catch (error) {
      message.error(`Failed to save exclusion rule. ${error.message}`)
    }
  }

  const handleDelete = useCallback(
    (rule) => {
      Modal.confirm({
        title: "Delete exclusion rule?",
        content: "Existing metrics remain unchanged until manually recomputed.",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await API.deleteRule(groupId, appId, rule.id)
            message.success("Exclusion rule deleted")
            if (rules.length === 1 && rulesPage > 1) {
              setRulesPage((page) => page - 1)
            } else {
              await loadRules()
            }
            await loadTree()
          } catch (error) {
            message.error(`Failed to delete exclusion rule. ${error.message}`)
          }
        },
      })
    },
    [appId, groupId, loadRules, loadTree, rules.length, rulesPage]
  )

  const ruleColumns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 70 },
      ...PATTERN_FIELDS.map(([field, label]) => ({
        title: label,
        dataIndex: field,
        render: (value) => value ?? "—",
      })),
      {
        title: "",
        width: 56,
        render: (_, rule) => (
          <Button
            type="text"
            danger
            disabled={!isAdmin}
            title={isAdmin ? "Delete rule" : "Requires ADMIN role"}
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(rule)}
          />
        ),
      },
    ],
    [handleDelete, isAdmin]
  )

  return (
    <>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Exclusion rules
        <TitleHelpTooltip
          title={EXCLUSION_RULES_HELP}
          ariaLabel="How exclusion rules work"
        />
      </Title>

      <div style={{ marginBottom: 16 }}>
        <CatalogBuildFilter
          selectedBuild={selectedBuild}
          onOpenPicker={() => setPickerOpen(true)}
          onClear={() => {
            setSelectedBuild(null)
            setBuildId(undefined)
          }}
        />
        <CatalogBuildPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          builds={builds}
          selectedBuildId={buildId}
          loading={buildsLoading}
          page={buildsPage}
          pageSize={BUILDS_PAGE_SIZE}
          total={buildsTotal}
          onPageChange={loadBuilds}
          onSelect={(build) => {
            setSelectedBuild(build)
            setBuildId(build.buildId)
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Saved rules
        </Title>
        {!editing && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!isAdmin}
            title={isAdmin ? undefined : "Requires ADMIN role"}
            onClick={() => {
              setEditing(true)
              setFormScrollToken((token) => token + 1)
              form.resetFields()
            }}
          >
            Create rule
          </Button>
        )}
      </div>

      {editing && (
        <div
          ref={exclusionFormRef}
          style={{
            marginBottom: 16,
            padding: "12px 16px 4px",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
          }}
        >
          <Title level={5} style={{ marginTop: 0 }}>
            New rule
          </Title>
          <Form form={form} layout="vertical">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {PATTERN_FIELDS.map(([field, label]) => (
                <Form.Item
                  key={field}
                  name={field}
                  label={label}
                  rules={[{ validator: regexValidator }]}
                >
                  <Input placeholder="Regular expression" />
                </Form.Item>
              ))}
            </div>
            <Form.Item
              dependencies={PATTERN_FIELDS.map(([field]) => field)}
              style={{ marginBottom: 12 }}
            >
              {() => {
                const hasPattern = PATTERN_FIELDS.some(([field]) =>
                  form.getFieldValue(field)
                )
                return (
                  <Space wrap>
                    <Button
                      type="primary"
                      disabled={!hasPattern}
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false)
                        form.resetFields()
                      }}
                    >
                      Cancel
                    </Button>
                  </Space>
                )
              }}
            </Form.Item>
          </Form>
        </div>
      )}

      <Table
        rowKey="id"
        size="small"
        loading={loadingRules}
        dataSource={rules}
        columns={ruleColumns}
        style={{ marginBottom: 16 }}
        scroll={{ x: true }}
        pagination={{
          current: rulesPage,
          pageSize: RULES_PAGE_SIZE,
          total: rulesTotal,
          onChange: setRulesPage,
          showSizeChanger: false,
        }}
      />

      {!buildId ? (
        <Text type="secondary">
          Select a build to browse the app structure and see which methods are excluded.
        </Text>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              App structure
              <TitleHelpTooltip
                title={APP_STRUCTURE_HELP}
                ariaLabel="How to use the app structure treemap"
              />
            </Title>
            <Text type="secondary">
              {affectedMethods} excluded methods / {totalMethods} total methods 
            </Text>
          </div>
          <div style={{ marginBottom: 24 }}>
            <IgnoreRulesTreemap
              roots={treeData}
              rootsLoading={loadingTree}
              onNodeContextMenu={handleNodeContextMenu}
            />
          </div>

          <Title level={5} style={{ marginTop: 0 }}>
            Packages / classes / methods
            <TitleHelpTooltip
              title={PACKAGE_TREE_HELP}
              ariaLabel="How to use the packages classes methods table"
            />
          </Title>
          <RawMethodsPackageTree
            groupId={groupId}
            appId={appId}
            buildId={buildId}
            data={treeData}
            loading={loadingTree}
            onAddExclusion={openExclusionForm}
            onNodeContextMenu={handleNodeContextMenu}
            exclusionActionLabel={EXCLUSION_ACTION_LABEL}
          />
        </>
      )}

      {contextMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1050 }}
          onClick={() => setContextMenu(null)}
          onContextMenu={(event) => {
            event.preventDefault()
            setContextMenu(null)
          }}
        >
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              boxShadow:
                "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12)",
              background: "#fff",
              borderRadius: 8,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Menu
              items={[
                {
                  key: "exclude",
                  label: EXCLUSION_ACTION_LABEL,
                  disabled: !isAdmin,
                },
              ]}
              onClick={({ key }) => {
                if (key === "exclude") {
                  openExclusionForm(contextMenu.node)
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
