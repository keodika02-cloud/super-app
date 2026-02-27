import { z } from 'zod';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const DepartmentSchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
});

const HrmInfoSchema = z.object({
    employee_code: z.string(),
    job_title: z.string(),
    current_shift: z.string(),
    is_remote_allowed: z.boolean(),
    checkin_radius_limit: z.number(),
});

const SettingsSchema = z.object({
    receive_noti: z.boolean(),
    language: z.string(),
    theme: z.enum(['light', 'dark']).optional(),
});

const ComplianceSchema = z.object({
    is_verified: z.boolean(),
    delete_scheduled_at: z.string().nullable(),
});

const SecuritySchema = z.object({
    last_login_at: z.string().datetime().optional(),
    last_login_ip: z.string().optional(),
});

// ─── User Schema ─────────────────────────────────────────────────────────────

export const UserSchema = z.object({
    id: z.number(),
    ulid: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    avatar: z.string().url().nullable(),
    role: z.enum(['STAFF', 'MANAGER', 'ADMIN']),
    permissions: z.array(z.string()),
    status: z.enum(['ACTIVE', 'BLOCKED', 'SCHEDULED_DELETE']),
    dept_name: z.string(),
    department: DepartmentSchema.optional(),
    hrm_info: HrmInfoSchema.optional(),
    settings: SettingsSchema.optional(),
    compliance: ComplianceSchema,
    security: SecuritySchema.optional(),
});

export const LoginDataSchema = z.object({
    access_token: z.string(),
    token_type: z.literal('Bearer'),
    expires_in: z.number(),
    user: UserSchema,
});

export const LoginResponseSchema = z.object({
    code: z.number(),
    status: z.enum(['success', 'fail', 'error']),
    message: z.string(),
    data: LoginDataSchema,
    trace_id: z.string(),
});

// ─── Login Form (Client-side validation) ─────────────────────────────────────

export const LoginFormSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type User = z.infer<typeof UserSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LoginFormData = z.infer<typeof LoginFormSchema>;
