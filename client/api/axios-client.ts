import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosClient = axios.create({
   baseURL: API_BASE_URL,
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json',
   },
});

axiosClient.interceptors.request.use(
   async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
   (response: AxiosResponse) => response.data,
   (error) => {
      if (error.response?.status === 401) { }
      return Promise.reject(error.response?.data || error.message);
   }
);



export default axiosClient;
