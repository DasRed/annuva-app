import {z} from 'zod';
import isStrongPassword from '@/validation/isStrongPassword';

/**
 * Validation for every new password (setup, registration, reset, users, profile, MCP).
 */
const passwordSchema = z.string().refine(isStrongPassword, {message: 'At least 9 characters with upper- and lower-case letters and a digit'});

export default passwordSchema;
