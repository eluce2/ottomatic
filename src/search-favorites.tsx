import { Action, ActionPanel, Color, List } from "@raycast/api";
import { useFavorites } from "./lib/favorites";
import { cache } from "./lib/ottomatic";
import useOrgPicker from "./components/org-picker";
import { useFrecencySorting } from "@raycast/utils";
import { ottomaticBaseUrl } from "./lib/constants";

export default function Command() {
	const { OrgPicker, selectedOrg, membership } = useOrgPicker();
	const { data: favs, revalidate, isLoading } = useFavorites(selectedOrg);
	const { data: sortedData, visitItem, resetRanking } = useFrecencySorting(favs ?? []);

	function ResetRankingAction({ fav }: { fav: NonNullable<typeof favs>[number] }) {
		return <Action title="Reset Ranking" onAction={() => resetRanking(fav)} />;
	}

	return (
		<List
			isLoading={isLoading}
			navigationTitle="Search Favorites"
			actions={
				<ActionPanel>
					<Action
						title="Clear Cache"
						onAction={() => {
							cache.clear();
							revalidate();
						}}
					/>
				</ActionPanel>
			}
			searchBarAccessory={OrgPicker}
		>
			<List.Section>
				{sortedData?.map((fav) => {
					if (fav.type === "url" && fav.url)
						return (
							<List.Item
								title={fav.name}
								key={fav.id}
								icon={{
									source: fav.url.startsWith("fmp") ? "claris.svg" : "server.svg",
									tintColor: Color.PrimaryText,
								}}
								actions={
									<ActionPanel>
										<Action.Open target={fav.url} title="Launch" onOpen={() => visitItem(fav)} />
										<ResetRankingAction fav={fav} />
									</ActionPanel>
								}
								subtitle={fav.url}
							/>
						);
					if (fav.type === "server")
						return (
							<List.Item
								title={fav.name}
								key={fav.id}
								icon={{ source: "server.svg" }}
								subtitle={fav.filemaker_servers.url}
							/>
						);
					if (fav.type === "file")
						return (
							<List.Item
								title={fav.name}
								key={fav.id}
								icon={{
									source: "claris.svg",
									tintColor: Color.PrimaryText,
								}}
								subtitle={fav.filemaker_servers.url}
								actions={
									<ActionPanel>
										<Action.Open target={fav.filemaker_servers.url} title="Launch" onOpen={() => visitItem(fav)} />
										<ResetRankingAction fav={fav} />
									</ActionPanel>
								}
							/>
						);
					return null;
				})}
			</List.Section>
			<List.Section>
				<List.Item
					title="Manage Favorites"
					icon={{ source: "external-link.svg" }}
					actions={
						<ActionPanel>
							<Action.OpenInBrowser
								url={`${ottomaticBaseUrl}/${membership?.organization.slug}/favorites`}
								title="Launch Cloud Console"
							/>
						</ActionPanel>
					}
				/>
			</List.Section>
		</List>
	);
}
