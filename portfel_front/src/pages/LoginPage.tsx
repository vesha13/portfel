import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
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
                    Вход в систему
                </Typography>
                <LoginForm />

                <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                    <Link
                        href="#"
                        variant="body2"
                        onClick={() => navigate('/register')}
                        sx={{ color: 'text.secondary' }}
                    >
                        Нет аккаунта? Зарегистрируйтесь
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;