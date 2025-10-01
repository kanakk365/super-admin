// Core User Types
export interface User {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isActive?: boolean;
  isDeleted?: boolean;
  loginTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

// API Response Types
export interface BaseApiResponse {
  statusCode: number;
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface ApiResponse<T = unknown> extends BaseApiResponse {
  data?: T;
}

export interface AuthResponse extends BaseApiResponse {
  user?: User;
  data?: {
    admin?: User;
    token?: string;
  };
  token?: string;
}

export interface ApiError {
  message: string;
  error?: string;
  status?: number;
  code?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalUsers: number;
  totalInstitutions: number;
  totalStudents: number;
  totalBlogs: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type:
    | "user_created"
    | "blog_published"
    | "institution_added"
    | "student_enrolled";
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

// Institution Types
export type InstitutionMode = "GPT" | "CBSE" | "CAMBRIDGE";

export interface Institution {
  id: string;
  name: string;
  type: string;
  pocName: string | null;
  affiliatedBoard: string;
  email: string;
  password: string | null;
  phone: string;
  website: string;
  yearOfEstablishment: string;
  totalStudentStrength: number;
  proofOfInstitutionUrl: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  address: string;
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  addedById: string;
  mode?: InstitutionMode | null;
}

// Institution Detail API Response Types
export interface InstitutionStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  standardId: string;
  sectionId: string;
  grade?: string;
  createdAt: string;
}

export interface InstitutionStudentsResponse {
  data: InstitutionStudent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InstitutionSummaryResponse {
  totals: {
    students: number;
    quizzes: number;
    quizSubmissions: number;
    exams: number;
    completedExams: number;
    projects: number;
    completedProjects: number;
  };
}

export interface InstitutionStudentsBreakdownResponse {
  byClass: {
    standardId: string;
    standardName: string;
    count: number;
  }[];
  bySection: {
    sectionId: string;
    sectionName: string;
    count: number;
  }[];
}

export interface InstitutionListResponse {
  data: Institution[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InstitutionStatsResponse {
  totals: {
    students: number;
    quizzes: number;
    quizSubmissions: number;
    exams: number;
    completedExams: number;
    projects: number;
    completedProjects: number;
  };
  breakdown: {
    byClass: {
      _count: {
        _all: number;
      };
      standardId: string;
      standardName: string;
    }[];
    bySection: {
      _count: {
        _all: number;
      };
      sectionId: string;
      sectionName: string;
    }[];
    gradesWithStrength: {
      standardId: string;
      grade: string;
      strength: number;
    }[];
    sectionsWithStrength: {
      sectionId: string;
      section: string;
      standardId: string;
      strength: number;
    }[];
  };
  assigned: {
    exams: {
      byClassSubject: {
        standardId: string;
        subject: string;
        count: number;
        standardName: string;
      }[];
      bySectionSubject: {
        sectionId: string;
        subject: string;
        count: number;
        sectionName: string;
      }[];
      bySchoolSubject: {
        subject: string;
        count: number;
      }[];
    };
    quizzes: {
      byClassSubject: {
        standardId: string;
        subject: string;
        count: number;
        standardName: string;
      }[];
      bySectionSubject: {
        sectionId: string;
        subject: string;
        count: number;
        sectionName: string;
      }[];
      bySchoolSubject: {
        subject: string;
        count: number;
      }[];
    };
    projects: {
      byClass: {
        standardId: string;
        count: number;
        standardName: string;
      }[];
      bySection: {
        sectionId: string;
        count: number;
        sectionName: string;
      }[];
    };
  };
  studentAnalytics: {
    examsLast3: {
      studentId: string;
      standardId: string;
      sectionId: string;
      score: number | null;
      examId: string;
      rn: string;
      standardName: string;
      sectionName: string;
    }[];
    quizzesLast3: {
      studentId: string;
      standardId: string;
      sectionId: string;
      score: number;
      totalQuestions: number;
      rn: string;
      standardName: string;
      sectionName: string;
    }[];
    projectsLast3: {
      studentId: string;
      standardId: string;
      sectionId: string;
      isCompleted: boolean;
      rn: string;
      standardName: string;
      sectionName: string;
    }[];
  };
  classSectionAnalytics: {
    exams: {
      recentByClass: {
        standardId: string;
        examId: string;
        avgscore: number | null;
        attempts: number;
        standardName: string;
      }[];
      recentBySection: {
        sectionId: string;
        examId: string;
        avgscore: number | null;
        attempts: number;
        sectionName: string;
      }[];
    };
    quizzes: {
      recentByClass: unknown[];
      recentBySection: unknown[];
    };
  };
  growth: {
    studentsByMonth: {
      month: string;
      count: number;
    }[];
  };
}

// Student Activity Types
export interface StudentActivityResponse {
  student: {
    id: string;
    name: string;
    email: string;
    standardId: string;
    sectionId: string;
    institutionId: string;
  };
  totals: {
    examsAssigned: number;
    examsCompleted: number;
    quizSubmissions: number;
    projectsAssigned: number;
    projectsCompleted: number;
    personalizedTopics: number;
    dailyChallenges: number;
  };
  exams: {
    id: string;
    studentId: string;
    examId: string;
    completed: boolean;
    score: number | null;
    startTime: string | null;
    endTime: string | null;
    createdAt: string;
    updatedAt: string;
    exam: {
      id: string;
      title: string;
      instructions: string;
      timeLimitMinutes: number;
      topic: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      createdAt: string;
      teacherId: string;
      institutionId: string;
      userId: string | null;
      type: string;
      isActive: boolean;
      createdBy: string;
      standardId: string | null;
      sectionId: string | null;
    };
  }[];
  quizzes: unknown[];
  projects: unknown[];
  personalizedLearning: unknown[];
  dailyChallenges: unknown[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
}

// Student Types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  institutionId: string;
  institutionName: string;
  course: string;
  enrollmentDate: string;
  status: "active" | "graduated" | "suspended" | "dropped";
  gpa?: number;
  address: Address;
  emergencyContact: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Blog Types
export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: BlogCategory;
  status: "draft" | "review" | "published" | "archived";
  featured: boolean;
  authorId: string;
  authorName: string;
  publishedAt?: string;
  viewCount: number;
  tags: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// Role & Permission Types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  description: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "select"
    | "textarea"
    | "date"
    | "number";
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern";
  value?: string | number;
  message: string;
}

// Table Types
export interface TableColumn<T = unknown> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TableAction<T = unknown> {
  label: string;
  icon?: React.ComponentType;
  onClick: (row: T) => void;
  variant?: "default" | "destructive" | "outline";
  disabled?: (row: T) => boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Filter & Search Types
export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "date" | "range" | "text";
  options?: SelectOption[];
  value?: unknown;
}

export interface SearchFilters {
  query?: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
}

// API Status Types
export interface ApiStatusState {
  connected: boolean;
  loading: boolean;
  error?: string;
  responseTime?: number;
  lastChecked?: string;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version?: string;
  database?: "connected" | "disconnected";
  services?: Record<string, "up" | "down">;
}

// Navigation Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
}

// Theme Types
export type Theme = "light" | "dark" | "system";

export interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "xl";
}

// Notification Types
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  duration?: number;
  action?: NotificationAction;
  createdAt: string;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

// Upload Types
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Feature Types
export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Institution Feature Assignment Types
export interface InstitutionFeatureAssignment {
  id: string;
  institutionId: string;
  featureId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  feature: Feature;
}

// Member Types
export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  phone: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

// Export all types for easy importing
export type {
  // Re-export commonly used types
  User as UserType,
  ApiResponse as ApiResponseType,
  AuthResponse as AuthResponseType,
  Institution as InstitutionType,
  Student as StudentType,
  Blog as BlogType,
  Role as RoleType,
  Member as MemberType,
  Feature as FeatureType,
  InstitutionFeatureAssignment as InstitutionFeatureAssignmentType,
};
