import React from 'react';

interface LandingPageProps {
    onLoginClick: () => void;
    onAdminClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onAdminClick }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden flex flex-col">
            {/* Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-900 via-black/80 to-black/60"></div>

            {/* Content */}
            <div className="relative z-20 flex-grow flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-wider uppercase mb-4 font-cinzel" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                    Fuego Dragón
                </h1>
                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
                    Tu portal exclusivo para las sagas de Westeros. Regístrate para acceder a un mundo de fantasía, intriga y batallas épicas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onLoginClick} className="bg-red-600 text-white font-bold py-3 px-8 rounded hover:bg-red-700 transition duration-300 transform hover:scale-105 text-lg">
                        Ingresar
                    </button>
                </div>
            </div>
            
            <footer className="relative z-20 text-center p-4">
                <button onClick={onAdminClick} className="text-xs text-gray-600 hover:text-gray-500 transition-colors">
                    Admin Panel
                </button>
            </footer>
        </div>
    );
};

export default LandingPage;