import React, { useEffect, useState, useRef } from "react";
import { Table, message, Button, Popconfirm, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Role } from "../../../modules/auth/models/role";
import * as API from "../../../modules/user-management/api-user-management";

export const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const [refreshFlag, refreshData] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const setSuccess = (data) => {
    message.success(data);
    refreshData(Date.now().toString());
  };

  const setError = (data) => {
    message.error(data);
    refreshData(Date.now().toString());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getUsers();
        setUsers(data);
      } catch (error) {
        message.error(`Failed to fetch users list. ${error?.message}`);
      }
    };

    fetchData();
  }, [refreshFlag]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters()
              setSearchText("")
              setSearchedColumn("")
              handleSearch("", confirm, dataIndex)
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current.select(), 100);
      }
    },
    render: (text) => {
      if (!(searchedColumn === dataIndex && searchText)) {
        return text
      }
      return <>{
        text
          .toString()
          .split(new RegExp(`(${searchText})`, 'gi'))
          .map((fragment, i) =>
            fragment.toLowerCase() === searchText.toLowerCase() ? (
              <span key={i} style={{ backgroundColor: "#ffc069" }}>{fragment}</span>
            ) : (
              fragment
            )
          )
      }</>
    },
  });

  if (!users.length) return <UsersStub />;

  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "10%",
      align: "left",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: "30%",
      align: "left",
      sorter: (a, b) => a.username.localeCompare(b.username),
      ...getColumnSearchProps("username"),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "20%",
      align: "left",
      render: (value) => <>{value.toUpperCase()}</>,
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    {
      title: "Blocked",
      dataIndex: "blocked",
      key: "blocked",
      width: "10%",
      align: "left",
      render: (value) => <>{value ? "blocked" : "-"}</>,
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    {
      title: "Actions",
      key: "actions",
      width: "30%",
      align: "left",
      render: (text, record) => renderUserManagementActions(record, setSuccess, setError),
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
};

export const UsersStub = () => <div>No users</div>;

function renderUserManagementActions(userData, setSuccess, setError) {
  return (
    <div>
      {userData.role === Role.UNDEFINED && (
        <Popconfirm
          title={`Are you sure you want to approve user "${userData.username}" registration?`}
          onConfirm={async () => {
            try {
              const data = await API.editUser(userData.id, {
                role: Role.USER,
              });
              setSuccess(data);
            } catch (error) {
              setError(error.message);
            }
          }}
        >
          <Button type="primary">Approve registration</Button>
        </Popconfirm>
      )}
      {userData.blocked === true ? (
        <Popconfirm
          title={`Are you sure you want to unblock the user "${userData.username}"?`}
          onConfirm={async () => {
            try {
              const data = await API.unblockUser(userData.id);
              setSuccess(data);
            } catch (error) {
              setError(error.message);
            }
          }}
        >
          <Button type="default">Unblock</Button>
        </Popconfirm>
      ) : (
        <>
          <Popconfirm
            title={`Are you sure you want to block the user "${userData.username}"?`}
            onConfirm={async () => {
              try {
                const data = await API.blockUser(userData.id);
                setSuccess(data);
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <Button type="danger">Block</Button>
          </Popconfirm>
          <Popconfirm
            title={`Are you sure you want to reset the password for user "${userData.username}"?`}
            onConfirm={async () => {
              try {
                const response = await API.resetPassword(userData.id);
                navigator.clipboard.writeText(response.data.password);
                setSuccess(
                  `${response.message} New password is copied to clipboard`
                );
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <Button type="default">Reset Password</Button>
          </Popconfirm>
          <Popconfirm
            title={`Are you sure you want to change role for user "${userData.username}" to ${userData.role === Role.USER ? Role.ADMIN : Role.USER}?`}
            onConfirm={async () => {
              try {
                const targetRole =
                  userData.role === Role.USER ? Role.ADMIN : Role.USER;
                const data = await API.editUser(userData.id, {
                  role: targetRole,
                });
                setSuccess(data);
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <Button type="default">
              Make {userData.role === Role.USER ? Role.ADMIN : Role.USER}
            </Button>
          </Popconfirm>
        </>
      )}
    </div>
  );
}
