import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../config';

const instance: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Добавляем интерцептор для автоматической вставки токена
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `JWT ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Экспортируем сам axios для использования isAxiosError
export { axios };
export default instance;