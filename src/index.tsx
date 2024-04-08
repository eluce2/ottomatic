import { ActionPanel, List, Action } from "@raycast/api";
import { authorize } from "./ottomatic";

export default function Command() {
  return (
    <List
      actions={
        <ActionPanel>
          <Action
            title="Login"
            onAction={() => {
              authorize();
            }}
          />
        </ActionPanel>
      }
    >
      {/* <List.Item
        icon="list-icon.png"
        title="Greeting"
        actions={
          <ActionPanel>
            <Action.Push title="Show Details" target={<Detail markdown="# Hey! 👋" />} />
          </ActionPanel>
        }
      /> */}
    </List>
  );
}
