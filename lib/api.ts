// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://apisimplylearn.selflearnai.in/api/v1",
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
  DEBUG: process.env.NEXT_PUBLIC_API_DEBUG === "true",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/super-admin/auth/super-admin/login",
      REGISTER: "/super-admin/auth/super-admin/register",
      LOGOUT: "/super-admin/auth/super-admin/logout",
      REGISTER_SUPER_INSTITUTION_ADMIN: "/super-admin/auth/super-admin/register-super-institution-admin",
    },
    USERS: "/super-admin/users",
    USER_ACTIVITY: "/super-admin/users",
    INSTITUTIONS: "/super-admin/institution",
    INSTITUTION_UPDATE: "/super-admin/institutions",
    INSTITUTION_BY_ID: "/super-admin/institution-by-id",
    INSTITUTION_STUDENTS: "/super-admin/institutions",
    INSTITUTION_SUMMARY: "/super-admin/institutions",
    INSTITUTION_STUDENTS_BREAKDOWN: "/super-admin/institutions",
    INSTITUTION_STATS: "/super-admin/institutions",
    BLOGS: "/super-admin/blogs",
    ROLES: "/super-admin/roles",
    HEALTH: "/super-admin/health",
    ANALYTICS: {
      MONTHLY: "/super-admin/analytics/monthly", // Assumed endpoint for monthly metrics
    },
  },
};

// Import types from centralized types file
import type {
  User,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  AuthResponse,
  ApiError,
  HealthCheckResponse,
  Institution,
  InstitutionListResponse,
  InstitutionStudentsResponse,
  InstitutionSummaryResponse,
  InstitutionStudentsBreakdownResponse,
  InstitutionStatsResponse,
  StudentActivityResponse,
  Member,
  Feature,
  InstitutionFeatureAssignment,
  InstitutionMode,
} from "./types";

// API Helper Functions
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Get auth token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      ...options,
    };

    // Always log for debugging login issues
    console.log(`API Request: ${config.method || "GET"} ${url}`, config);

    try {
      const response = await fetch(url, config);

      // Always log for debugging login issues
      console.log(`API Response: ${response.status} ${url}`, response);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
          message: response.statusText,
        }))) as ApiError;

        throw new Error(
          errorData.message || errorData.error || `HTTP ${response.status}`,
        );
      }

      const data = (await response.json()) as T;

      // Always log for debugging login issues
      console.log(`API Data: ${url}`, data);

      return data;
    } catch (error) {
      // Always log for debugging login issues
      console.error(`API Error: ${url}`, error);

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async registerSuperInstitutionAdmin(userData: { name: string; email: string; password: string; role: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER_SUPER_INSTITUTION_ADMIN, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
    });
  }

  // Health Check
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>(API_CONFIG.ENDPOINTS.HEALTH, {
      method: "GET",
    });
  }

  // Analytics
  async getMonthlyAnalytics(params?: { year?: number }): Promise<unknown> {
    const query = params?.year ? `?year=${params.year}` : "";
    return this.get(`${API_CONFIG.ENDPOINTS.ANALYTICS.MONTHLY}${query}`);
  }

  // Generic CRUD methods
  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Resource-specific methods (examples for future use)
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.get<ApiResponse<User[]>>(API_CONFIG.ENDPOINTS.USERS);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.post<ApiResponse<User>>(API_CONFIG.ENDPOINTS.USERS, userData);
  }

  async updateUser(
    id: string,
    userData: Partial<User>,
  ): Promise<ApiResponse<User>> {
    return this.put<ApiResponse<User>>(
      `${API_CONFIG.ENDPOINTS.USERS}/${id}`,
      userData,
    );
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.delete<ApiResponse>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`);
  }

  async getUserActivity(userId: string): Promise<ApiResponse<StudentActivityResponse>> {
    return this.get<ApiResponse<StudentActivityResponse>>(`${API_CONFIG.ENDPOINTS.USER_ACTIVITY}/${userId}/activity`);
  }

  // Institution-specific methods
  async getInstitutionById(id: string): Promise<ApiResponse<Institution>> {
    return this.get<ApiResponse<Institution>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_BY_ID}?id=${id}`);
  }

  async getInstitutionStudents(institutionId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<InstitutionStudentsResponse>> {
    return this.get<ApiResponse<InstitutionStudentsResponse>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_STUDENTS}/${institutionId}/students?page=${page}&limit=${limit}`);
  }

  async getInstitutionSummary(institutionId: string): Promise<ApiResponse<InstitutionSummaryResponse>> {
    return this.get<ApiResponse<InstitutionSummaryResponse>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_SUMMARY}/${institutionId}/summary`);
  }

  async getInstitutionStudentsBreakdown(institutionId: string): Promise<ApiResponse<InstitutionStudentsBreakdownResponse>> {
    return this.get<ApiResponse<InstitutionStudentsBreakdownResponse>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_STUDENTS_BREAKDOWN}/${institutionId}/students-breakdown`);
  }

  async getInstitutionStats(institutionId: string): Promise<ApiResponse<InstitutionStatsResponse>> {
    return this.get<ApiResponse<InstitutionStatsResponse>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_STATS}/${institutionId}/stats`);
  }

  async updateInstitution(institutionId: string, data: Partial<Institution>): Promise<ApiResponse<Institution>> {
    return this.put<ApiResponse<Institution>>(`${API_CONFIG.ENDPOINTS.INSTITUTION_UPDATE}/${institutionId}`, data);
  }

  async getSuperInstitutionAdminsInstitutions(page: number = 1, limit: number = 10): Promise<ApiResponse<InstitutionListResponse>> {
    return this.get<ApiResponse<InstitutionListResponse>>(`/super-admin/institutions/my?page=${page}&limit=${limit}`);
  }

  async getInstitutionFeatures(institutionId: string): Promise<ApiResponse<InstitutionFeatureAssignment[]>> {
    return this.get<ApiResponse<InstitutionFeatureAssignment[]>>(`/super-admin/institutions/${institutionId}/features`);
  }

  async getAllInstitutions(page: number = 1, limit: number = 100): Promise<ApiResponse<InstitutionListResponse>> {
    return this.get<ApiResponse<InstitutionListResponse>>(`${API_CONFIG.ENDPOINTS.INSTITUTIONS}?page=${page}&limit=${limit}`);
  }

  async assignInstitutionFeatures(data: {
    institutionId: string;
    features: Array<{ key: string; enabled: boolean }>;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.post<ApiResponse<{ message: string }>>('/super-admin/institutions/assign-features', data);
  }

  async switchInstitutionMode(
    institutionId: string,
    mode: InstitutionMode,
  ): Promise<ApiResponse<{ mode: InstitutionMode }>> {
    return this.post<ApiResponse<{ mode: InstitutionMode }>>(
      `/super-admin/institutions/${institutionId}/switch`,
      { mode },
    );
  }

  // Roles API methods
  async getRolesUnderAdmin(): Promise<ApiResponse<Member[]>> {
    return this.get<ApiResponse<Member[]>>(`/super-admin/role-under-admin`);
  }

  async createRoleUnderAdmin(memberData: {
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    roleName: string;
    password: string;
  }): Promise<ApiResponse<Member>> {
    return this.post<ApiResponse<Member>>(`/super-admin/role-under-admin`, memberData);
  }

  // Features API methods
  async getFeatures(): Promise<ApiResponse<Feature[]>> {
    return this.get<ApiResponse<Feature[]>>(`/super-admin/features`);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

// Utility function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Re-export types for convenience
export type {
  User,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  AuthResponse,
  ApiError,
  HealthCheckResponse,
  Member,
};
