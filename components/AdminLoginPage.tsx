import React, { useState } from 'react';

interface AdminLoginPageProps {
    onAdminLogin: (email: string, pass: string) => Promise<void>;
    onBackToLanding: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAdminLogin, onBackToLanding }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError("Por favor, introduce email y contraseña.");
            return;
        }
        
        setIsLoading(true);
        try {
            await onAdminLogin(email, password);
            // Navigation to admin panel is handled in App.tsx
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-6 font-cinzel">
                    Acceso de Administrador
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            placeholder="admin@email.com"
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
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Entrar'}
                    </button>
                </form>
                 <div className="mt-6 text-center">
                    <button onClick={onBackToLanding} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                        <i className="fa-solid fa-arrow-left mr-2"></i>
                        Regresar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;