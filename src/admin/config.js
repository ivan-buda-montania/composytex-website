export const API_URL = import.meta.env.VITE_API_URL;
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
export const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
// Only set by the local stack (scripts/local-stack.mjs), which fakes Cognito.
export const COGNITO_ENDPOINT = import.meta.env.VITE_COGNITO_ENDPOINT || `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
// Where uploaded images are served from; empty in production (same origin).
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || '';

export const SECTIONS = [
  { id: 'machinery', label: 'Maquinaria' },
  { id: 'materials', label: 'Materiales' },
];

export const TAGS = [
  { id: 'pharma', label: 'Farmacéutico' },
  { id: 'food', label: 'Alimentos' },
  { id: 'lab', label: 'Laboratorio' },
  { id: 'industry', label: 'Industrial' },
  { id: 'dental', label: 'Dental' },
];
