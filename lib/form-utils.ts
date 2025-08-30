import type {
  FormField,
  ValidationRule,
  SelectOption,
  LoginCredentials,
  RegisterData,
} from "./types";

// Form validation utilities
export class FormValidator {
  static validateField(value: string, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
      const error = this.validateRule(value, rule);
      if (error) return error;
    }
    return null;
  }

  private static validateRule(
    value: string,
    rule: ValidationRule,
  ): string | null {
    switch (rule.type) {
      case "required":
        return !value.trim() ? rule.message : null;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? rule.message : null;

      case "minLength":
        return value.length < (rule.value as number) ? rule.message : null;

      case "maxLength":
        return value.length > (rule.value as number) ? rule.message : null;

      case "pattern":
        const regex = new RegExp(rule.value as string);
        return !regex.test(value) ? rule.message : null;

      default:
        return null;
    }
  }

  static validateForm<T extends Record<string, unknown>>(
    data: T,
    fields: FormField[],
  ): Record<keyof T, string | null> {
    const errors = {} as Record<keyof T, string | null>;

    fields.forEach((field) => {
      const value = (data[field.name as keyof T] as string) || "";
      const fieldErrors = this.validateField(value, field.validation || []);
      errors[field.name as keyof T] = fieldErrors;
    });

    return errors;
  }

  static hasErrors<T extends Record<string, unknown>>(
    errors: Record<keyof T, string | null>,
  ): boolean {
    return Object.values(errors).some((error) => error !== null);
  }
}

// Form field configurations
export const LOGIN_FORM_FIELDS: FormField[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
    placeholder: "Enter your email",
    validation: [
      { type: "required", message: "Email is required" },
      { type: "email", message: "Invalid email format" },
    ],
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
    placeholder: "Enter your password",
    validation: [
      { type: "required", message: "Password is required" },
      {
        type: "minLength",
        value: 6,
        message: "Password must be at least 6 characters",
      },
    ],
  },
];

export const REGISTER_FORM_FIELDS: FormField[] = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "Enter your full name",
    validation: [
      { type: "required", message: "Name is required" },
      {
        type: "minLength",
        value: 2,
        message: "Name must be at least 2 characters",
      },
    ],
  },
  ...LOGIN_FORM_FIELDS,
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    required: true,
    placeholder: "Confirm your password",
    validation: [
      { type: "required", message: "Password confirmation is required" },
    ],
  },
];

// Form state management
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string | null>;
  loading: boolean;
  touched: Record<keyof T, boolean>;
}

export class FormManager<T extends Record<string, unknown>> {
  private state: FormState<T>;
  private fields: FormField[];
  private onStateChange: (state: FormState<T>) => void;

  constructor(
    initialData: T,
    fields: FormField[],
    onStateChange: (state: FormState<T>) => void,
  ) {
    this.fields = fields;
    this.onStateChange = onStateChange;
    this.state = {
      data: initialData,
      errors: {} as Record<keyof T, string | null>,
      loading: false,
      touched: {} as Record<keyof T, boolean>,
    };
  }

  updateField(field: keyof T, value: unknown): void {
    const newData = { ...this.state.data, [field]: value };
    const newTouched = { ...this.state.touched, [field]: true };

    // Validate only the changed field if it's been touched
    const fieldConfig = this.fields.find((f) => f.name === field);
    const fieldError = fieldConfig
      ? FormValidator.validateField(
          value as string,
          fieldConfig.validation || [],
        )
      : null;

    const newErrors = { ...this.state.errors, [field]: fieldError };

    this.state = {
      ...this.state,
      data: newData,
      errors: newErrors,
      touched: newTouched,
    };

    this.onStateChange(this.state);
  }

  validateAll(): boolean {
    const errors = FormValidator.validateForm(this.state.data, this.fields);
    const touched = {} as Record<keyof T, boolean>;

    // Mark all fields as touched
    this.fields.forEach((field) => {
      touched[field.name as keyof T] = true;
    });

    this.state = {
      ...this.state,
      errors,
      touched,
    };

    this.onStateChange(this.state);
    return !FormValidator.hasErrors(errors);
  }

  setLoading(loading: boolean): void {
    this.state = { ...this.state, loading };
    this.onStateChange(this.state);
  }

  reset(newData?: Partial<T>): void {
    this.state = {
      data: { ...this.state.data, ...newData },
      errors: {} as Record<keyof T, string | null>,
      loading: false,
      touched: {} as Record<keyof T, boolean>,
    };
    this.onStateChange(this.state);
  }

  getState(): FormState<T> {
    return this.state;
  }
}

// Predefined form data types
export interface LoginFormData extends LoginCredentials {
  rememberMe?: boolean;
}

export interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

export interface UserProfileFormData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  website?: string;
  location?: string;
}

// Form submission helpers
export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export class FormSubmissionHandler {
  static async handleSubmission<TFormData, TResponse>(
    formData: TFormData,
    submitFn: (data: TFormData) => Promise<TResponse>,
    onSuccess?: (result: TResponse) => void,
    onError?: (error: string) => void,
  ): Promise<FormSubmissionResult<TResponse>> {
    try {
      const result = await submitFn(formData);

      if (onSuccess) {
        onSuccess(result);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      if (onError) {
        onError(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Common form options
export const GENDER_OPTIONS: SelectOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
];

// Form field helpers
export const createSelectField = (
  name: string,
  label: string,
  options: SelectOption[],
  required = false,
): FormField => ({
  name,
  label,
  type: "select",
  required,
  options,
  validation: required
    ? [{ type: "required", message: `${label} is required` }]
    : [],
});

export const createTextField = (
  name: string,
  label: string,
  placeholder?: string,
  required = false,
  minLength?: number,
  maxLength?: number,
): FormField => {
  const validation: ValidationRule[] = [];

  if (required) {
    validation.push({ type: "required", message: `${label} is required` });
  }

  if (minLength) {
    validation.push({
      type: "minLength",
      value: minLength,
      message: `${label} must be at least ${minLength} characters`,
    });
  }

  if (maxLength) {
    validation.push({
      type: "maxLength",
      value: maxLength,
      message: `${label} must be no more than ${maxLength} characters`,
    });
  }

  return {
    name,
    label,
    type: "text",
    required,
    placeholder,
    validation,
  };
};

export const createEmailField = (
  name = "email",
  label = "Email Address",
  required = true,
): FormField => ({
  name,
  label,
  type: "email",
  required,
  placeholder: "Enter your email address",
  validation: [
    ...(required
      ? [{ type: "required" as const, message: "Email is required" }]
      : []),
    { type: "email", message: "Invalid email format" },
  ],
});

export const createPasswordField = (
  name = "password",
  label = "Password",
  minLength = 6,
  required = true,
): FormField => ({
  name,
  label,
  type: "password",
  required,
  placeholder: "Enter your password",
  validation: [
    ...(required
      ? [{ type: "required" as const, message: "Password is required" }]
      : []),
    {
      type: "minLength",
      value: minLength,
      message: `Password must be at least ${minLength} characters`,
    },
  ],
});

// Export utility functions for common operations
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, " ");
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
};

export const generateFormId = (prefix = "form"): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
