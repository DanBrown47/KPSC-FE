import * as yup from 'yup';

export const agendaItemSchema = yup.object({
  topic: yup.string().required('Topic is required').min(5, 'Topic must be at least 5 characters'),
  wing: yup.number().required('Wing is required'),
  meeting: yup.number().required('Meeting is required'),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
  discussion_points: yup.string().nullable(),
  file_number: yup.string().nullable(),
  is_supplementary: yup.boolean().default(false),
});

export const returnReasonSchema = yup.object({
  reason: yup.string()
    .required('Return reason is required')
    .min(10, 'Reason must be at least 10 characters'),
});

export const meetingSchema = yup.object({
  title: yup.string().required('Meeting title is required'),
  sitting_date: yup.date().required('Meeting date is required').min(new Date(), 'Meeting date must be in the future'),
  venue: yup.string().required('Venue is required'),
  description: yup.string().nullable(),
});

export const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export const userSchema = yup.object({
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  global_role: yup.string().required('Role is required'),
  password: yup.string().when('$isNew', {
    is: true,
    then: (schema) => schema.required('Password is required').min(8, 'Password must be at least 8 characters'),
    otherwise: (schema) => schema.nullable(),
  }),
});
