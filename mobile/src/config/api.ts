const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const getApiUrl = () => API_URL;

export const getApiEndpoint = (path: string) => {
  const base = getApiUrl();
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};