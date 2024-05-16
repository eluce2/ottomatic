import { useCachedPromise } from "@raycast/utils";
import { fetch } from "cross-fetch";
import { getJWT } from "./ottomatic";
import { z } from "zod";
import { apiBaseUrl } from "./constants";

const fmserverConnectionTypeSchema = z.union([z.literal("privateKey"), z.literal("ottoAdminApiKey")]);
const osSchema = z.union([z.literal("mac"), z.literal("windows"), z.literal("linux")]);

const filemakerServersRowSchema = z
  .object({
    auth_error: z.boolean(),
    cert_expire_timestamp: z.string().nullable(),
    connection_error: z.boolean(),
    connection_type: fmserverConnectionTypeSchema.nullable(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    fms_version: z.string().nullable(),
    gemba_id: z.string().nullable(),
    id: z.number(),
    location: z.string(),
    metadata: z.object({
      ottoServerTag: z.enum(["dev", "stg", "prod"]).nullable(),
      ottoThemeColor: z.string().nullable(),
    }),
    name_friendly: z.string().nullable(),
    org_id: z.number(),
    os: osSchema.nullable(),
    otto_admin_api_key: z.string().nullable(),
    otto_port: z.number(),
    otto_version: z.string().nullable(),
    ottomatic_status: z.string().nullable(),
    ottomatic_url: z.string().nullable(),
    url: z.string(),
    vultr_id: z.string().nullable(),
  })
  .pick({
    id: true,
    url: true,
    name_friendly: true,
    connection_error: true,
    auth_error: true,
    ottomatic_status: true,
    fms_version: true,
    otto_version: true,
    location: true,
    os: true,
    metadata: true,
  })
  .extend({ isOttomatic: z.boolean() });

export function useServers(org_id: string | null) {
  return useCachedPromise(
    async (org_id: string | null) => {
      if (!org_id) return [];

      const data = await fetch(`${apiBaseUrl}/servers`, {
        headers: { Authorization: `Bearer ${await getJWT()}`, org_id },
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .catch((e) => {
          console.error("fetch servers error:", e);
          throw e;
        });

      return z.object({ data: filemakerServersRowSchema.array() }).parse(data).data;
    },
    [org_id],
    { execute: !!org_id || org_id === "", initialData: [], keepPreviousData: true },
  );
}
