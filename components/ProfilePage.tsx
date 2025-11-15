import React, { useState, useMemo } from 'react';
import type { User, Series, Episode } from '../types';

interface ProfilePageProps {
    user: User;
    seriesList: Series[];
    onBack: () => void;
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
    onUpdateProfile: (updatedDetails: Pick<User, 'name' | 'country' | 'city' | 'phoneNumber'>) => Promise<{ success: boolean, message: string }>;
    onSaveFeedback: (comment: string) => Promise<{ success: boolean, message: string }>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, seriesList, onBack, onChangePassword, onUpdateProfile, onSaveFeedback }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [country, setCountry] = useState(user.country);
    const [city, setCity] = useState(user.city);
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    const [feedback, setFeedback] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const handleAccordionToggle = (accordionName: string) => {
        setOpenAccordion(prev => (prev === accordionName ? null : accordionName));
    };

    const episodeMap = useMemo(() => {
        const map = new Map<number, { seriesTitle: string, episode: Episode }>();
        seriesList.forEach(series => {
            series.episodes.forEach(episode => {
                map.set(episode.id, { seriesTitle: series.title, episode });
            });
        });
        return map;
    }, [seriesList]);

    const watchedEpisodesDetails = user.watchedEpisodes.map(id => episodeMap.get(id)).filter(Boolean).reverse();
    const purchasedEpisodesDetails = (user.purchasedEpisodes || []).map(id => episodeMap.get(id)).filter(Boolean);

    const validateNewPassword = () => {
        if (newPassword.length < 8) {
            setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
            return false;
        }
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passRegex.test(newPassword)) {
            setPasswordError('La nueva contraseña debe contener letras y al menos un número.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Las nuevas contraseñas no coinciden.');
            return false;
        }
        return true;
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (validateNewPassword()) {
            setIsPasswordLoading(true);
            const result = await onChangePassword(currentPassword, newPassword);
            if (result.success) {
                setPasswordSuccess(result.message);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(result.message);
            }
            setIsPasswordLoading(false);
        }
    };

    const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);

        if (!name || !country || !city || !phoneNumber) {
            setProfileError("Todos los campos de perfil son obligatorios.");
            return;
        }
        
        if (!/^\d+$/.test(phoneNumber)) {
            setProfileError('El número de celular solo debe contener dígitos.');
            return;
        }

        setIsProfileLoading(true);
        const result = await onUpdateProfile({ name, country, city, phoneNumber });
        if (result.success) {
            setProfileSuccess(result.message);
            setIsEditing(false);
        } else {
            setProfileError(result.message);
        }
        setIsProfileLoading(false);
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackMessage(null);
        if (!feedback.trim()) {
            setFeedbackMessage({ type: 'error', text: "El comentario no puede estar vacío." });
            return;
        }

        setIsFeedbackLoading(true);
        const result = await onSaveFeedback(feedback);
        if (result.success) {
            setFeedbackMessage({ type: 'success', text: result.message });
            setFeedback('');
        } else {
            setFeedbackMessage({ type: 'error', text: result.message });
        }
        setIsFeedbackLoading(false);
    };

    const handleCancelEdit = () => {
        setName(user.name);
        setCountry(user.country);
        setCity(user.city);
        setPhoneNumber(user.phoneNumber);
        setIsEditing(false);
        setProfileError(null);
        setProfileSuccess(null);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-28 min-h-screen text-white">
            <button onClick={onBack} className="mb-8 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition">
                <i className="fa-solid fa-arrow-left mr-2"></i> Volver al inicio
            </button>
            <h2 className="text-4xl font-bold text-center mb-10 uppercase tracking-widest font-cinzel">Mi Perfil</h2>

            <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700">
                <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                    <h3 className="text-2xl font-semibold font-cinzel">Información del Usuario</h3>
                    {!isEditing && (
                        <button onClick={() => { setIsEditing(true); setProfileSuccess(null); }} className="bg-blue-600 text-white font-bold py-1 px-3 rounded hover:bg-blue-700 text-sm transition-colors">
                            <i className="fa-solid fa-pencil mr-2"></i>Editar
                        </button>
                    )}
                </div>

                {profileError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center mb-4">{profileError}</p>}
                {profileSuccess && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm text-center mb-4">{profileSuccess}</p>}
                
                {!isEditing ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <p><span className="font-bold text-gray-400">Email:</span> {user.email}</p>
                        <p><span className="font-bold text-gray-400">Nombre:</span> {user.name || 'No especificado'}</p>
                        <p><span className="font-bold text-gray-400">País:</span> {user.country || 'No especificado'}</p>
                        <p><span className="font-bold text-gray-400">Ciudad:</span> {user.city || 'No especificado'}</p>
                        <p><span className="font-bold text-gray-400">Celular:</span> {user.phoneNumber || 'No especificado'}</p>
                    </div>
                ) : (
                    <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                        </div>
                         <div className="flex gap-4">
                             <div className="flex-1">
                                <label htmlFor="country" className="block text-sm font-medium text-gray-300">País</label>
                                <input type="text" id="country" value={country} onChange={e => setCountry(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                             </div>
                             <div className="flex-1">
                                <label htmlFor="city" className="block text-sm font-medium text-gray-300">Ciudad</label>
                                <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                             </div>
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">Número Celular</label>
                            <input type="tel" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleCancelEdit} disabled={isProfileLoading} className="bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500 transition duration-300 disabled:opacity-50">Cancelar</button>
                            <button type="submit" disabled={isProfileLoading} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300 disabled:opacity-50 flex items-center justify-center min-w-[150px]">
                                {isProfileLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Watched History */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700">
                    <h3 className="text-2xl font-semibold mb-4 font-cinzel border-b border-gray-600 pb-2">Historial de Visualización</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {watchedEpisodesDetails.length > 0 ? (
                            watchedEpisodesDetails.map(detail => detail && (
                                <div key={detail.episode.id} className="bg-gray-900/70 p-3 rounded-md">
                                    <p className="font-bold">{detail.seriesTitle} - T{detail.episode.season}:E{detail.episode.episode}</p>
                                    <p className="text-sm text-gray-400">{detail.episode.title}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">Aún no has visto ningún episodio.</p>
                        )}
                    </div>
                </div>

                {/* Purchased Content */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700">
                    <h3 className="text-2xl font-semibold mb-4 font-cinzel border-b border-gray-600 pb-2">Contenido Adquirido</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {user.unlockedHoD && (
                            <div className="bg-green-900/50 p-3 rounded-md flex items-center gap-3">
                                <i className="fa-solid fa-unlock-keyhole text-green-400"></i>
                                <p className="font-bold text-green-300">'House of the Dragon' Desbloqueado</p>
                            </div>
                        )}
                         {purchasedEpisodesDetails.length > 0 ? (
                            purchasedEpisodesDetails.map(detail => detail && (
                                <div key={detail.episode.id} className="bg-gray-900/70 p-3 rounded-md">
                                    <p className="font-bold">{detail.seriesTitle} - T{detail.episode.season}:E{detail.episode.episode}</p>
                                    <p className="text-sm text-gray-400">{detail.episode.title}</p>
                                </div>
                            ))
                        ) : (
                             !user.unlockedHoD && <p className="text-gray-400">No has comprado contenido adicional.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Accordion Sections */}
            <div className="mt-8 space-y-4">
                 {/* Feedback Accordion */}
                <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => handleAccordionToggle('feedback')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60 transition-colors"
                        aria-expanded={openAccordion === 'feedback'}
                        aria-controls="feedback-content"
                    >
                        <h3 className="text-2xl font-semibold font-cinzel">Tus Comentarios y Sugerencias</h3>
                        <i className={`fa-solid fa-chevron-down transform transition-transform duration-300 ${openAccordion === 'feedback' ? 'rotate-180' : ''}`}></i>
                    </button>
                    {openAccordion === 'feedback' && (
                        <div id="feedback-content" className="p-6 border-t border-gray-700">
                             <p className="text-gray-400 mb-4 text-sm">Tus experiencias, ideas para mejorar o cualquier otro comentario es muy importante para nosotros. ¡Ayúdanos a mejorar Fuego Dragón!</p>
                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                {feedbackMessage && (
                                    <p className={`${feedbackMessage.type === 'success' ? 'text-green-400 bg-green-900/50' : 'text-red-400 bg-red-900/50'} p-3 rounded-md text-sm text-center`}>
                                        {feedbackMessage.text}
                                    </p>
                                )}
                                <div>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        rows={5}
                                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                        placeholder="Escribe aquí tus comentarios sobre la página, los videos, qué te gustaría que mejoráramos, etc."
                                    />
                                </div>
                                <div className="text-right">
                                    <button type="submit" disabled={isFeedbackLoading} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md hover:bg-red-700 transition duration-300 disabled:opacity-50 flex items-center justify-center min-w-[150px] ml-auto">
                                        {isFeedbackLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Enviar Comentario'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                {/* Change Password Accordion */}
                <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => handleAccordionToggle('password')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60 transition-colors"
                        aria-expanded={openAccordion === 'password'}
                        aria-controls="password-content"
                    >
                        <h3 className="text-2xl font-semibold font-cinzel">Cambiar Contraseña</h3>
                        <i className={`fa-solid fa-chevron-down transform transition-transform duration-300 ${openAccordion === 'password' ? 'rotate-180' : ''}`}></i>
                    </button>
                    {openAccordion === 'password' && (
                        <div id="password-content" className="p-6 border-t border-gray-700">
                            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-md mx-auto">
                                {passwordError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm text-center">{passwordSuccess}</p>}
                                <div>
                                    <label htmlFor="current-password"
                                           className="block text-sm font-medium text-gray-300">Contraseña Actual</label>
                                    <input type="password" id="current-password" value={currentPassword}
                                           onChange={e => setCurrentPassword(e.target.value)}
                                           className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                           required/>
                                </div>
                                 <div>
                                    <label htmlFor="new-password"
                                           className="block text-sm font-medium text-gray-300">Nueva Contraseña</label>
                                    <input type="password" id="new-password" value={newPassword}
                                           onChange={e => setNewPassword(e.target.value)}
                                           className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                           required/>
                                </div>
                                 <div>
                                    <label htmlFor="confirm-password"
                                           className="block text-sm font-medium text-gray-300">Confirmar Nueva Contraseña</label>
                                    <input type="password" id="confirm-password" value={confirmPassword}
                                           onChange={e => setConfirmPassword(e.target.value)}
                                           className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                           required/>
                                </div>
                                <button type="submit" disabled={isPasswordLoading}
                                        className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300 disabled:opacity-50 flex items-center justify-center">
                                    {isPasswordLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Actualizar Contraseña'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

               
            </div>
        </div>
    );
};

export default ProfilePage;