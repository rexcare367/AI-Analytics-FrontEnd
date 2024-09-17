import axios from 'axios';
// config
import { AUTH_API_URL } from '../config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: AUTH_API_URL });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

export default axiosInstance;
