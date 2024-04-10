import { useCachedPromise } from "@raycast/utils";
import { fetch } from "cross-fetch";
import { getJWT } from "./ottomatic";
import { z } from "zod";
import { compact } from "lodash";

const favoriteSchema = z.union([z.literal("server"), z.literal("file"), z.literal("url")]);
const orgMemberFavoritesRowSchema = z.object({
  created_at: z.string().nullable(),
  filename: z.string().nullable(),
  id: z.number(),
  name: z.string(),
  org_id: z.number(),
  server_id: z.number().nullable(),
  type: favoriteSchema,
  url: z.string().nullable(),
  user_id: z.string(),
});
const zFavoriteServer = orgMemberFavoritesRowSchema.extend({
  type: z.literal("server"),
  filename: z.literal(null).optional(),
  filemaker_servers: z.object({
    url: z.string(),
  }),
});
const zFavoriteFile = zFavoriteServer.extend({
  type: z.literal("file"),
  filename: z.string(),
});
const zFavoriteUrl = orgMemberFavoritesRowSchema.extend({
  type: z.literal("url"),
});

/**
 * These types have to be declared manually becuase we're doing fancy validation to ensure this format
 */
type FavoriteBase = Omit<
  z.infer<typeof orgMemberFavoritesRowSchema> & {
    filemaker_servers: { url: string } | null;
  },
  "org_member_id" | "created_at"
>;

export type OrgMemberFavorite =
  | (FavoriteBase & {
      type: "url";
      url: string;
      filename?: null;
      server_id?: null;
    })
  | (FavoriteBase & {
      type: "server";
      filemaker_servers: { url: string };
      filename?: null;
      url?: null;
    })
  | (FavoriteBase & {
      type: "file";
      filemaker_servers: { url: string };
      filename: string;
      url?: null;
    });
export function useFavorites(org_id: string | null) {
  return useCachedPromise(
    async (org_id: string | null) => {
      const token = await getJWT();
      if (!org_id) throw new Error("org_id is required");
      const result = (await fetch("http://localhost:3060/api/v0/favorites", {
        headers: { Authorization: `Bearer ${token}`, org_id: org_id ?? "" },
      }).then((res) => {
        if (!res.ok) {
          console.error("fetch favorites error:", res.statusText);
        }
        return res.json();
      })) as { data: OrgMemberFavorite[] };

      // validate data
      const data =
        result.data?.map((o) => {
          if (o.type === "server") {
            const result = zFavoriteServer.safeParse(o);
            return result.success ? result.data : undefined;
          }
          if (o.type === "file") {
            const result = zFavoriteFile.safeParse(o);
            return result.success ? result.data : undefined;
          }
          if (o.type === "url") {
            const result = zFavoriteUrl.safeParse(o);
            return result.success ? result.data : undefined;
          }
          return o;
        }) ?? [];

      // remove all undefined from data (in case of validation errors)
      const goodData = data ? compact(data) : [];
      return goodData.map((o) => ({ ...o, id: o.id.toString() }));
    },
    [org_id],
    { keepPreviousData: true, execute: !!org_id && org_id !== "" },
  );
}
