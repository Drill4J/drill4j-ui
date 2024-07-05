import { GenerateApiKeyForm } from "./generate-api-key-form";
import { UserApiKeysTable } from "./my-api-keys-table";
import { useState } from "react";

const MyApiKeys = () => {
  const [refreshFlag, refreshData] = useState("")
  return (
    <div>
      <GenerateApiKeyForm
        refreshData = {() => refreshData(Date.now().toString())}
      />
      <UserApiKeysTable
        refreshData = {() => refreshData(Date.now().toString())}
        refreshFlag = {refreshFlag}
      />
    </div>
  );
};

export default MyApiKeys;
