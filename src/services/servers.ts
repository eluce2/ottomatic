import { useCachedPromise } from "@raycast/utils";
import { fetch } from "cross-fetch";
import { getJWT } from "./ottomatic";

export function useServers(org_id: string | null) {
  return useCachedPromise(async () => {
    const data = await fetch("http://localhost:3060/api/v0/servers", {
      headers: { Authorization: `Bearer ${await getJWT()}`, org_id: org_id ?? "" },
    }).then((res) => res.json());
    console.log(data);
    return data;
  }, []);
}
