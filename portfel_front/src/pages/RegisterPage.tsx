import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import RegisterForm from '../components/Auth/RegisterForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="xs">
            <Box sx={{
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 4,
                borderRadius: 2,
                boxShadow: 3,
                bgcolor: 'background.paper'
            }}>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Регистрация
                </Typography>
                <RegisterForm />

                <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                    <Link
                        href="#"
                        variant="body2"
                        onClick={() => navigate('/login')}
                        sx={{ color: 'text.secondary' }}
                    >
                        Уже есть аккаунт? Войдите
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default RegisterPage;