import type { Project, Skill, User, PaginatedProjectList, PaginatedUserList } from "./types";

export class APIError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.detail || data?.message || "Ошибка API");
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

let cachedCsrfToken = "";

export async function ensureCsrfToken(): Promise<string> {
  const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
  if (cookieMatch && cookieMatch[1] !== undefined) {
    cachedCsrfToken = cookieMatch[1];
    return cachedCsrfToken;
  }

  try {
    const res = await fetch("/api/users/csrf/");
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (e) {
    console.error("Не удалось получить CSRF токен:", e);
  }
  return cachedCsrfToken;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const method = options.method || "GET";
  const isSafe = ["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());

  const headers = new Headers(options.headers);
  
  if (!isSafe) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  // Set default content type to application/json if not uploading files
  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return null;
  }

  let data;
  const contentType = res.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    throw new APIError(res.status, data);
  }

  return data;
}

export const api = {
  // --- Auth & Profile ---
  async login(credentials: any): Promise<User> {
    return apiFetch("/api/users/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async register(data: any): Promise<User> {
    return apiFetch("/api/users/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    return apiFetch("/api/users/logout/", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async getProfile(): Promise<User> {
    return apiFetch("/api/users/profile/");
  },

  async updateProfile(profileData: any): Promise<User> {
    // Determine if it contains file upload for avatar
    const isFormData = profileData instanceof FormData;
    return apiFetch("/api/users/profile/", {
      method: "PUT",
      body: isFormData ? profileData : JSON.stringify(profileData),
    });
  },

  async changePassword(passwordData: any): Promise<any> {
    return apiFetch("/api/users/change-password/", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },

  // --- Projects ---
  async listProjects(params?: { skills?: string; page?: number }): Promise<PaginatedProjectList> {
    const searchParams = new URLSearchParams();
    if (params?.skills) {
      searchParams.set("skills", params.skills);
    }
    if (params?.page) {
      searchParams.set("page", params.page.toString());
    }
    const query = searchParams.toString();
    return apiFetch(`/api/projects/${query ? `?${query}` : ""}`);
  },

  async getProject(id: number): Promise<Project> {
    return apiFetch(`/api/projects/${id}/`);
  },

  async createProject(projectData: any): Promise<Project> {
    return apiFetch("/api/projects/", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id: number, projectData: any): Promise<Project> {
    return apiFetch(`/api/projects/${id}/`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(id: number): Promise<void> {
    return apiFetch(`/api/projects/${id}/`, {
      method: "DELETE",
    });
  },

  async completeProject(id: number): Promise<{ status: string; project_status: string }> {
    // Match schema: POST to /api/projects/{id}/complete/ requires Project object in requestBody (or can be empty in django view, wait. Views.py uses request.data but actually it doesn't read it for completing, so passing empty body is fine).
    return apiFetch(`/api/projects/${id}/complete/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async toggleParticipate(id: number): Promise<{ status: string; participant: boolean }> {
    return apiFetch(`/api/projects/${id}/toggle-participate/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  // --- Skills ---
  async getUsedSkills(): Promise<Skill[]> {
    return apiFetch("/api/projects/skills/used/");
  },

  async autocompleteSkills(q: string): Promise<Skill[]> {
    // GET /api/projects/skills/?q=<q>
    // Returns PaginatedSkillList which has count, next, previous, results.
    // We want to return the raw list of skills (results).
    const data = await apiFetch(`/api/projects/skills/?q=${encodeURIComponent(q)}`);
    // Django view returns paginated list OR a flat array depending on serializer.
    // If it's paginated (has count and results), return results. Otherwise return the array.
    if (data && typeof data === "object" && "results" in data) {
      return data.results;
    }
    return Array.isArray(data) ? data : [];
  },

  async addSkillToProject(id: number, skillPayload: { skill_id?: number; name?: string }): Promise<any> {
    return apiFetch(`/api/projects/${id}/skills/add/`, {
      method: "POST",
      body: JSON.stringify(skillPayload),
    });
  },

  async removeSkillFromProject(projectId: number, skillId: number): Promise<void> {
    return apiFetch(`/api/projects/${projectId}/skills/${skillId}/remove/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  // --- Users ---
  async listUsers(page?: number): Promise<PaginatedUserList> {
    const query = page ? `?page=${page}` : "";
    return apiFetch(`/api/users/list/${query}`);
  },

  async getUser(id: number): Promise<User> {
    return apiFetch(`/api/users/${id}/`);
  },
};
