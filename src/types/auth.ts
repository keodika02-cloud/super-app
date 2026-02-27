/**
 * src/types/auth.ts
 * Zod schemas và TypeScript types cho Authentication.
 * Khớp 100% với JSON contract từ Backend Laravel.
 */
import { z } from 'zod';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const DepartmentSchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().optional(),
});

const HrmInfoSchema = z.object({
    employee_code: z.string(),
    job_title: z.string(),
    current_shift: z.string(),
    is_remote_allowed: z.boolean(),
    checkin_radius_limit: z.number(),
});

const SettingsSchema = z.object({
    receive_noti: z.boolean().optional(),
    language: z.string().optional(),
    theme: z.enum(['light', 'dark']).optional(),
});

const ComplianceSchema = z.object({
    is_verified: z.boolean(),
    delete_scheduled_at: z.string().nullable(),
});

// ─── User Schema (Hardened) ───────────────────────────────────────────────────

export const UserSchema = z.object({
    id: z.number(),
    ulid: z.string().optional().nullish(),
    name: z.string().catch('Người dùng QVC'),
    email: z.string().email().catch('guest@qvc.vn'),
    phone: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    role: z.string().catch('STAFF'), // Relaxed enum for backend changes
    permissions: z.array(z.string()).optional().default([]),
    status: z.string().optional().default('ACTIVE'),
    auth_domains: z.array(z.string()).optional().default([]),
    dept_name: z.string().optional().nullish(),
    department: DepartmentSchema.optional().nullish(),
    hrm_info: HrmInfoSchema.optional().nullish(),
    settings: SettingsSchema.optional().nullish(),
    compliance: ComplianceSchema.optional().nullish(),
}).passthrough(); // Allow unknown fields without crashing

// ─── Login Response (Resilient Mapping) ───────────────────────────────────────

export const LoginDataSchema = z.object({
    // Handle both 'access_token' (Standard) and 'token' (App Legacy/Custom)
    access_token: z.string().optional(),
    token: z.string().optional(),
    token_type: z.string().optional().default('Bearer'),
    expires_in: z.number().optional(),
    user: z.union([
        UserSchema,
        z.object({ user: UserSchema }).transform((val) => val.user) // Handle nested user: { user: { id... } }
    ]),
}).transform((data) => ({
    ...data,
    access_token: data.access_token || data.token || '', // Unified token field
}));

export type User = z.infer<typeof UserSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
