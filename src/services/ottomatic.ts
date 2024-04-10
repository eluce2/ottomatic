import { OAuth, Cache } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetch } from "cross-fetch";
import { decodeJwt } from "jose";
import { z } from "zod";

export const cache = new Cache({ namespace: "ottomatic" });

const isDev = process.env.NODE_ENV === "development";
const clientId = isDev ? "xONriBaQdRwxkE53" : "knPOnlv1o1yv2NQf";
const authBaseUrl = isDev ? "https://humble-urchin-18.clerk.accounts.dev" : "https://clerk.ottomatic.cloud";
export const ottomaticBaseUrl = isDev ? "http://localhost:3060" : "https://api.ottomatic.cloud";
export const apiBaseUrl = ottomaticBaseUrl + "/api/v0";

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Ottomatic",
  description: "Sign in with Ottomatic",
});

async function getAccessToken(): Promise<{ accessToken: string }> {
  const tokenSet = await client.getTokens();
  if (tokenSet?.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      await client.setTokens(await refreshTokens(tokenSet.refreshToken));
    }
    return { accessToken: tokenSet.accessToken };
  }

  const authRequest = await client.authorizationRequest({
    endpoint: `${authBaseUrl}/oauth/authorize`,
    clientId,
    extraParameters: { response_type: "code" },
    scope: "email private_metadata profile public_metadata",
  });
  const { authorizationCode } = await client.authorize(authRequest);
  const tokenResp = await fetchTokens(authRequest, authorizationCode);
  await client.setTokens(tokenResp);
  return { accessToken: tokenResp.access_token };
}

async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("code", authCode);
  params.append("code_verifier", authRequest.codeVerifier);
  params.append("grant_type", "authorization_code");
  params.append("response_type", "code");
  params.append("redirect_uri", authRequest.redirectURI);

  const response = await fetch(`${authBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!response.ok) {
    console.error("fetch tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const response = await fetch(`${authBaseUrl}/oauth/token`, {
    method: "POST",
    body: params,
  });
  if (!response.ok) {
    console.error("refresh tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}

export async function getJWT(): Promise<string> {
  const jwt = cache.get("jwt");
  if (jwt) {
    // if not expired, return it
    const { exp } = decodeJwt(jwt);
    if (!!exp && exp * 1000 > Date.now()) {
      return jwt;
    }
  }

  const { accessToken } = await getAccessToken();
  const data = await fetch(`${apiBaseUrl}/login`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => res.json());
  cache.set("jwt", data.token);

  return data.token;
}

export function useJWT() {
  const { data: jwt, ...rest } = useCachedPromise(getJWT, [], {
    initialData: cache.get("jwt"),
    keepPreviousData: true,
  });

  if (!jwt) {
    return { data: undefined, ...rest };
  }
  const deocded = decodeJwt(jwt);
  const data = z
    .object({
      memberships: z.array(
        z.object({
          id: z.string(),
          organization: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            imageUrl: z.string(),
            hasImage: z.boolean(),
          }),
          role: z.string(),
        }),
      ),
    })
    .or(z.undefined())
    .catch(undefined)
    .parse(deocded);

  return { data, ...rest };
}
