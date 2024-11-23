import { create } from 'zustand';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  lastActive?: string;
  projects?: string[];
}

interface TeamStore {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  setMemberStatus: (id: string, status: 'active' | 'inactive') => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  members: [
    {
      id: '1',
      name: 'John Doe',
      role: 'Admin',
      email: 'john@example.com',
      status: 'active',
      permissions: ['manage_agents', 'manage_team', 'view_analytics'],
      lastActive: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Developer',
      email: 'jane@example.com',
      status: 'active',
      permissions: ['manage_agents', 'view_analytics'],
      lastActive: new Date().toISOString(),
    },
  ],

  addMember: (member) =>
    set((state) => ({
      members: [
        ...state.members,
        {
          ...member,
          id: Math.random().toString(36).substring(7),
        },
      ],
    })),

  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.id === id ? { ...member, ...updates } : member
      ),
    })),

  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((member) => member.id !== id),
    })),

  setMemberStatus: (id, status) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.id === id ? { ...member, status } : member
      ),
    })),
}));