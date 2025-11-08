import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string) => Promise<{ success: boolean, message: string }>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const validateRegistration = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Formato de correo inválido.');
            return false;
        }

        const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];
        const domain = email.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            setError('Solo se permiten correos de Gmail, Outlook, Yahoo, ProtonMail o iCloud.');
            return false;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return false;
        }

        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passRegex.test(password)) {
            setError('La contraseña debe contener letras y al menos un número.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!email || !password) {
            setError("Por favor, introduce tu email y contraseña.");
            return;
        }
        
        setIsLoading(true);

        if (mode === 'register') {
            if (validateRegistration()) {
                const result = await onRegister(email, password);
                if (result.success) {
                    setSuccessMessage(result.message);
                    setMode('login');
                    setEmail('');
                    setPassword('');
                } else {
                    setError(result.message);
                }
            }
        } else { // Login mode
            try {
                await onLogin(email, password);
                // Navigation happens in App.tsx
            } catch (err: any) {
                setError(err.message || "Error al iniciar sesión.");
            }
        }
        setIsLoading(false);
    };
    
    const toggleMode = () => {
        setMode(prevMode => prevMode === 'login' ? 'register' : 'login');
        setError(null);
        setSuccessMessage(null);
        setEmail('');
        setPassword('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-6 font-cinzel">
                    {mode === 'login' ? 'Acceder' : 'Registrarse'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}
                    {successMessage && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm text-center">{successMessage}</p>}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            placeholder="tu@email.com"
                            autoComplete="email"
                        />
                    </div>
                    <div>
                         <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            placeholder="********"
                            autoComplete="current-password"
                        />
                    </div>
                    {mode === 'login' && <p className="text-xs text-gray-400 text-center">Si no tienes una cuenta, se creará una al registrarte.</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : (mode === 'login' ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={toggleMode} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;