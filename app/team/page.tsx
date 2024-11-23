"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { AddTeamMemberModal } from "@/components/team/add-team-member-modal";
import { useTeamStore } from "@/lib/stores/team-store";

export default function Team() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const teamMembers = useTeamStore((state) => state.members);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <AddTeamMemberModal />
      </div>

      <div className="grid gap-6">
        {teamMembers.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">No team members yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add team members to start collaborating
              </p>
              <AddTeamMemberModal />
            </div>
          </Card>
        ) : (
          teamMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              selected={selectedMember === member.id}
              onSelect={() => setSelectedMember(member.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}