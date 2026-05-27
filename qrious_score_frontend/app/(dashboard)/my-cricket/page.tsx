"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Swords, Trophy, Shield } from "lucide-react";
import { Tabs, TabPanel } from "@/app/components/ui/tabs";
import { MyCricketMatchesTab } from "@/app/components/my-cricket/matches-tab";
import { MyCricketTournamentsTab } from "@/app/components/my-cricket/tournaments-tab";
import { MyCricketTeamsTab } from "@/app/components/my-cricket/teams-tab";

const VALID_TABS = ["matches", "tournaments", "teams"];

const tabs = [
  { id: "matches", label: "Matches", icon: <Swords size={15} /> },
  { id: "tournaments", label: "Tournaments", icon: <Trophy size={15} /> },
  { id: "teams", label: "Teams", icon: <Shield size={15} /> },
];

export default function MyCricketPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    return VALID_TABS.includes(tabParam || "")
      ? (tabParam as string)
      : "matches";
  });

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/my-cricket?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          My Cricket
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your matches, tournaments, and teams — all in one place.
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="pills"
        size="md"
      />

      {activeTab === "matches" && (
        <TabPanel>
          <MyCricketMatchesTab />
        </TabPanel>
      )}

      {activeTab === "tournaments" && (
        <TabPanel>
          <MyCricketTournamentsTab />
        </TabPanel>
      )}

      {activeTab === "teams" && (
        <TabPanel>
          <MyCricketTeamsTab />
        </TabPanel>
      )}
    </div>
  );
}
