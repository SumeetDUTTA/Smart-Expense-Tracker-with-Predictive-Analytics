import { z } from 'zod';

// Validation schema for updating user metadata
export const updateUserMetaSchema = z.object({
    body: z.object({
        monthlyBudget: z.number()
            .min(0, 'Monthly budget must be a positive number')
            .max(1000000, 'Monthly budget seems too high')
            .optional(),
        userType: z.enum([
            'college_student',
            'young_professional',
            'family_moderate',
            'family_high',
            'luxury_lifestyle',
            'senior_retired'
        ]).optional(),
        firstName: z.string()
            .min(1, 'First name is required')
            .max(50, 'First name too long')
            .optional(),
        lastName: z.string()
            .min(1, 'Last name is required')
            .max(50, 'Last name too long')
            .optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update"
    })
});