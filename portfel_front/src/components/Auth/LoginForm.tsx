import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TextField, Button, Box } from '@mui/material';
import { login } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { loginSuccess } from '../../store/authSlice';

interface LoginFormData {
    username: string;
    password: string;
}

const schema = yup.object().shape({
    username: yup
        .string()
        .required('Обязательное поле')
        .min(3, 'Минимум 3 символа'),
    password: yup.string().min(6, 'Минимум 6 символов').required('Обязательное поле'),
});

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await login(data.username, data.password);
            dispatch(loginSuccess({
                token: response.token,
                user: { username: data.username }
            }));
            navigate('/'); // Редирект на главную страницу
        } catch (error) {
            console.error('Ошибка авторизации:', error);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            <TextField
                {...register('username')}
                label="Логин"
                fullWidth
                margin="normal"
                error={!!errors.username}
                helperText={errors.username?.message}
            />
            <TextField
                {...register('password')}
                label="Пароль"
                type="password"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
                Войти
            </Button>
        </Box>
    );
};

export default LoginForm;