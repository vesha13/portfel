import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import { register } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const schema = yup.object().shape({
    username: yup
        .string()
        .required('Обязательное поле')
        .min(3, 'Минимум 3 символа'),
    email: yup
        .string()
        .email('Некорректный email')
        .required('Обязательное поле'),
    password: yup
        .string()
        .required('Обязательное поле')
        .min(6, 'Минимум 6 символов'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Пароли должны совпадать')
        .required('Подтвердите пароль'),
});

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            await register(data.username, data.email, data.password);
            navigate('/login', { state: { successRegister: true } });
        } catch (err) {
            setError('Ошибка регистрации. Проверьте введенные данные');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
            }}
        >
            <Typography variant="h6" component="h2" textAlign="center">
                Создать аккаунт
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
                {...formRegister('username')}
                label="Имя пользователя"
                fullWidth
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={loading}
            />

            <TextField
                {...formRegister('email')}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading}
            />

            <TextField
                {...formRegister('password')}
                label="Пароль"
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={loading}
            />

            <TextField
                {...formRegister('confirmPassword')}
                label="Подтвердите пароль"
                type="password"
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={loading}
            />

            <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>
        </Box>
    );
};

export default RegisterForm;