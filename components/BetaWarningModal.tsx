import React from 'react';

interface BetaWarningModalProps {
    onDismiss: () => void;
}

const BetaWarningModal: React.FC<BetaWarningModalProps> = ({ onDismiss }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up text-center">
                <div className="p-6 md:p-8">
                    <div className="text-yellow-400 mb-4">
                        <i className="fas fa-exclamation-triangle fa-3x"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white font-cinzel mb-3">Versión Beta</h2>
                    <p className="text-gray-300 mb-6">
                        ¡Bienvenido a Fuego Dragón! Actualmente, nuestra plataforma se encuentra en fase de pruebas. Estamos trabajando arduamente para mejorar tu experiencia y añadir nuevas funcionalidades.
                    </p>
                    <button
                        onClick={onDismiss}
                        className="bg-red-600 text-white font-bold py-2 px-8 rounded hover:bg-red-700 transition duration-300 transform hover:scale-105"
                    >
                        Entendido
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default BetaWarningModal;
