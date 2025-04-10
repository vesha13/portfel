import axios from 'axios';
import { store } from '../store';
import { loginSuccess } from '../store/authSlice';
import { API_URL } from '../config';

export const login = async (username: string, password: string) => {
    try {
        const response = await axios.post(API_URL + 'auth/jwt/create/', {
            username,
            password,
        });

        const { data: userData } = await axios.get(API_URL + 'auth/users/me/', {
            headers: {
                Authorization: `JWT ${response.data.access}`,
            },
        });

        store.dispatch(loginSuccess({
            token: response.data.access,
            user: userData,
        }));

        return response.data;
    } catch (error) {
        throw new Error('Ошибка авторизации');
    }
};

export const register = async (username: string, email: string, password: string) => {
    try {
        const response = await axios.post(API_URL + 'auth/users/', {
            username,
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw new Error('Ошибка регистрации');
    }
};