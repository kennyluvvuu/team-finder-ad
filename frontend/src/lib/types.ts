export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  phone: string;
  avatar: string;
  github_url: string;
  about: string;
}

export interface UserMini {
  id: number;
  name: string;
  surname: string;
  avatar: string;
}

export interface Skill {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: UserMini;
  created_at: string;
  github_url: string;
  status: "open" | "closed";
  participants: UserMini[];
  skills: Skill[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PaginatedProjectList = PaginatedResponse<Project>;
export type PaginatedUserList = PaginatedResponse<User>;
export type PaginatedSkillList = PaginatedResponse<Skill>;
