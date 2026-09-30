import { API_URL } from './config';
import { getIdToken } from './auth';

export class UnauthorizedError extends Error {}

async function request(method, path, body) {
  const token = await getIdToken();
  if (!token) throw new UnauthorizedError('Tu sesión expiró.');
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new UnauthorizedError('Tu sesión expiró.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

export const api = {
  getCatalog: () => request('GET', '/catalog'),
  saveProduct: (id, product, create) =>
    request('PUT', `/products/${encodeURIComponent(id)}`, { product, create }),
  deleteProduct: id => request('DELETE', `/products/${encodeURIComponent(id)}`),
  saveOrder: ids => request('PUT', '/order', { ids }),
  uploadImage: (name, contentType, data) => request('POST', '/media', { name, contentType, data }),
};
