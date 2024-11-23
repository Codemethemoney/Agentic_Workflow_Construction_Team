"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Mail,
  Clock,
  Shield,
  UserX,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTeamMemberModal } from "./edit-team-member-modal";
import { TeamMember, useTeamStore } from "@/lib/stores/team-store";
import { useToast } from "@/hooks/use-toast";

interface TeamMemberCardProps {
  member: TeamMember;
  selected: boolean;
  onSelect: () => void;
}

export function TeamMemberCard({ member, selected, onSelect }: TeamMemberCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const { setMemberStatus, removeMember } = useTeamStore();
  const { toast } = useToast();

  const handleStatusChange = () => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    setMemberStatus(member.id, newStatus);
    toast({
      title: "Status Updated",
      description: `${member.name}'s status has been set to ${newStatus}`,
    });
  };

  const handleRemove = () => {
    removeMember(member.id);
    toast({
      title: "Team Member Removed",
      description: `${member.name} has been removed from the team`,
    });
  };

  return (
    <>
      <Card
        className={`transition-colors ${
          selected ? "border-primary" : "hover:border-muted-foreground/25"
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{member.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                variant={member.status === "active" ? "default" : "secondary"}
                className="capitalize"
              >
                {member.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStatusChange}>
                    <Shield className="mr-2 h-4 w-4" />
                    {member.status === "active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleRemove}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Active</p>
              <p className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {new Date(member.lastActive || "").toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium">Permissions</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {member.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {permission.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTeamMemberModal
        member={member}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />
    </>
  );
}