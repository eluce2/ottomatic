import { ActionPanel, List, Action } from "@raycast/api";
import { getJWT, useJWT } from "./services/ottomatic";
import { useServers } from "./services/servers";

export default function Command() {
  const { data } = useJWT();
  const { data: servers } = useServers(data?.memberships[0].organization.id ?? null);
  console.log(servers);

  return (
    <List
      navigationTitle="Search Beers"
      searchBarPlaceholder="Search your favorite drink"
      actions={
        <ActionPanel>
          <Action
            title="Log Token"
            onAction={async () => {
              const accessToken = await getJWT();
              console.log(accessToken);
            }}
          />
        </ActionPanel>
      }
      searchBarAccessory={
        <List.Dropdown tooltip="Select Organization" storeValue>
          {data?.memberships.map((membership) => (
            <List.Dropdown.Item
              value={membership.organization.id}
              key={membership.id}
              icon={{ source: membership.organization.imageUrl }}
              title={membership.organization.name}
            />
          ))}
        </List.Dropdown>
      }
    >
      <List.Item title="Beer 1" />
    </List>
  );
}
