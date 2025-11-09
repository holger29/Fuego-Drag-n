import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    onViewProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onViewProfile }) => {
    return (
        <header className="bg-black bg-opacity-50 shadow-lg w-full fixed top-0 z-10">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider uppercase font-cinzel">
                    Fuego Dragón
                </h1>
                <nav>
                    {user && (
                        <div className="flex items-center gap-4">
                            <span className="hidden sm:block text-white">Bienvenido, {user.email.split('@')[0]}</span>
                            <button
                                onClick={onViewProfile}
                                className="bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-600 transition duration-300"
                            >
                                Mi Perfil
                            </button>
                            <button
                                onClick={onLogout}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition duration-300"
                            >
                                Salir
                            </button>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;