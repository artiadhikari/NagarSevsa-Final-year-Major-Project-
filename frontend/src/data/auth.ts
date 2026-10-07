export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "ward_officer" | "ward_engineer" | "field_worker";
  department: string;
  zone: string;
  ward?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "vmc_auth_token";
const USER_KEY = "vmc_auth_user";

export const DEMO_CREDENTIALS = [
  {
    roleName: "Ward Officer (Ward 12)",
    email: "ward.west@vmc.gov.in",
    password: "Officer@123",
    role: "ward_officer",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    ward: "12",
  },
  {
    roleName: "Super Admin (Commissioner)",
    email: "admin@vmc.gov.in",
    password: "Admin@123",
    role: "super_admin",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    const user = JSON.parse(data) as User;
    if ((user.role === "ward_officer" || user.role === "ward_engineer") && !user.ward) {
      user.ward = "12";
    }
    return user;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to log in.");
  }

  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
