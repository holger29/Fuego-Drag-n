import React from 'react';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('https://images.alphacoders.com/133/1339665.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
             <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-wider uppercase mb-4 font-cinzel" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                Fuego Dragón
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
                Tu portal exclusivo para las sagas de Westeros. Regístrate para acceder a un mundo de fantasía, intriga y batallas épicas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onLoginClick} className="bg-red-600 text-white font-bold py-3 px-8 rounded hover:bg-red-700 transition duration-300 transform hover:scale-105 text-lg">
                    Iniciar Sesión
                </button>
                <button onClick={onLoginClick} className="bg-gray-700 text-white font-bold py-3 px-8 rounded hover:bg-gray-600 transition duration-300 text-lg">
                    Registrarse
                </button>
            </div>
        </div>
    );
};

export default LandingPage;