import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string, name: string, country: string, city: string, phoneNumber: string) => Promise<{ success: boolean, message: string }>;
    onBackToLanding: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, onBackToLanding }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

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

        if (!name || !country || !city || !phoneNumber) {
            setError('Por favor, completa todos los campos.');
            return false;
        }
        if (!/^\d+$/.test(phoneNumber)) {
            setError('El número de celular solo debe contener dígitos.');
            return false;
        }


        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        if (mode === 'login') {
            if (!email || !password) {
                setError("Por favor, introduce tu email y contraseña.");
                setIsLoading(false);
                return;
            }
             try {
                await onLogin(email, password);
            } catch (err: any) {
                setError(err.message || "Error al iniciar sesión.");
            }
        } else if (mode === 'register') {
            if (validateRegistration()) {
                const result = await onRegister(email, password, name, country, city, phoneNumber);
                if (result.success) {
                    setSuccessMessage(result.message);
                    clearStateAndSetMode('login');
                } else {
                    setError(result.message);
                }
            }
        }
        setIsLoading(false);
    };

    const clearStateAndSetMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setError(null);
        setSuccessMessage(null);
        setEmail('');
        setPassword('');
        setName('');
        setCountry('');
        setCity('');
        setPhoneNumber('');
    };

    const handleForgotPassword = () => {
        const emailTo = "holgereduardo777@outlook.com";
        const subject = "Solicitud Restablecimiento Contraseña.";
        const body = "Cordial saludos equipo de Fuego Dragón, el presente correo es para solicitar el restablecimiento de mi contraseña la cual perdí o no la recuerdo. Agradezco su atención prestada, quedo atento.";
        window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        setIsForgotPasswordModalOpen(false);
        setSuccessMessage("Tu solicitud de restablecimiento de contraseña ha sido enviada satisfactoriamente. En las próximas horas recibirás un correo electrónico con tu nueva contraseña.");
    };

    const ForgotPasswordModal = () => (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700 animate-fade-in-up">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white text-center mb-4 font-cinzel">Restablecer Contraseña</h3>
                    <p className="text-gray-300 text-center mb-6">
                        Al hacer clic en el siguiente botón automaticamente enviarás un correo electrónico al equipo de soporte Fuego Dragón solicitando el restablecimiento de tu contraseña.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsForgotPasswordModalOpen(false)}
                            className="bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500 transition duration-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-700 transition duration-300"
                        >
                            Restablecer Contraseña
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );

    const renderFormContent = () => {
        return (
            <>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="********"
                        autoComplete={mode === 'login' ? "current-password" : "new-password"}
                    />
                </div>
                {mode === 'register' && (
                    <>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Ej: Jon Nieve" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="country" className="block text-sm font-medium text-gray-300">País</label>
                                <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)}  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Ej: Westeros" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="city" className="block text-sm font-medium text-gray-300">Ciudad</label>
                                <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)}  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Ej: Invernalia" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">Número Celular</label>
                            <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Ej: 5551234567" />
                        </div>
                    </>
                )}
            </>
        );
    };

    const getTitle = () => {
        return mode === 'login' ? 'Acceder' : 'Registrarse';
    }
    
    const getButtonText = () => {
         if (isLoading) return <i className="fa-solid fa-spinner fa-spin"></i>;
         return mode === 'login' ? 'Entrar' : 'Registrarse';
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            {isForgotPasswordModalOpen && <ForgotPasswordModal />}
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-6 font-cinzel">
                    {getTitle()}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}
                    {successMessage && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm text-center">{successMessage}</p>}
                    
                    {renderFormContent()}
                    
                    {mode === 'login' && error?.includes("Credenciales incorrectas") && (
                        <div className="text-right -mt-2">
                            <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="text-sm text-red-500 hover:text-red-400">
                                Olvidé mi contraseña
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full pt-3 pb-3 mt-2 bg-green-600 text-white font-bold px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {getButtonText()}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={() => clearStateAndSetMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-green-400 hover:text-green-300 transition-colors">
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
                 <div className="mt-4 text-center">
                    <button onClick={onBackToLanding} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                        <i className="fa-solid fa-arrow-left mr-2"></i>
                        Regresar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;