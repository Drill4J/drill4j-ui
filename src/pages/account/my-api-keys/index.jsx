import { GenerateApiKeyForm } from "./generate-api-key-form";
import { UserApiKeysTable } from "./my-api-keys-table";
import { useState } from "react";

const MyApiKeys = () => {
  const [refreshFlag, refreshData] = useState("")
  return (
    <>
      <GenerateApiKeyForm
        refreshData = {() => refreshData(Date.now().toString())}
      />
      <div style={{marginTop:'15px'}} />
      <UserApiKeysTable
        refreshData = {() => refreshData(Date.now().toString())}
        refreshFlag = {refreshFlag}
      />
    </>
  );
};

export default MyApiKeys;
