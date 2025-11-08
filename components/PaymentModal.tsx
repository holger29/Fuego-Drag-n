import React, { useState } from 'react';

interface PaymentModalProps {
    amount: number;
    itemName: string;
    onSuccess: () => void;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ amount, itemName, onSuccess, onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate network delay
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700 animate-fade-in-up">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white font-cinzel">Procesar Pago</h2>
                    <p className="text-gray-400 mt-1">Estás a punto de comprar: <span className="font-semibold text-white">{itemName}</span></p>
                </div>
                <form onSubmit={handlePayment} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="card-number" className="block text-sm font-medium text-gray-300">Número de Tarjeta (simulado)</label>
                            <input
                                type="text"
                                id="card-number"
                                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="4242 4242 4242 4242"
                                disabled={isProcessing}
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="expiry" className="block text-sm font-medium text-gray-300">Expiración</label>
                                <input type="text" id="expiry" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="MM/YY" disabled={isProcessing} required />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="cvc" className="block text-sm font-medium text-gray-300">CVC</label>
                                <input type="text" id="cvc" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="123" disabled={isProcessing} required />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-between items-center">
                        <span className="text-xl font-bold text-white">Total: ${amount.toFixed(2)}</span>
                        <div className="flex gap-3">
                             <button
                                type="button"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500 transition duration-300 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="bg-red-600 text-white font-bold py-2 px-6 rounded hover:bg-red-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                            >
                                {isProcessing ? (
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                ) : (
                                    `Pagar $${amount.toFixed(2)}`
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PaymentModal;
