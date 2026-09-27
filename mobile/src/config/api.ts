import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const getApiUrl = () => API_URL;

export const getApiEndpoint = (path: string) => {
  const base = getApiUrl();
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};