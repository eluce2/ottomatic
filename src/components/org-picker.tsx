import { List } from "@raycast/api";
import { useJWT } from "../services/ottomatic";
import { useCachedState } from "@raycast/utils";

export default function useOrgPicker() {
  const { data } = useJWT();
  const [selectedOrg, setSelectedOrg] = useCachedState<string>("selectedOrg", "");
  const membership = data?.memberships.find((membership) => membership.organization.id === selectedOrg);

  const OrgPicker = (
    <List.Dropdown tooltip="Select Organization" storeValue value={selectedOrg} onChange={(val) => setSelectedOrg(val)}>
      {data?.memberships.map((membership) => (
        <List.Dropdown.Item
          value={membership.organization.id}
          key={membership.id}
          icon={{ source: membership.organization.imageUrl }}
          title={membership.organization.name}
        />
      ))}
    </List.Dropdown>
  );
  return { OrgPicker, selectedOrg, membership };
}
