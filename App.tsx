import React, { useState, useEffect } from 'react';
import type { User, Series, Episode } from './types';
import { getSeries, getSeriesById } from './services/geminiService';
import Header from './components/Header';
import LandingPage from './components/Welcome';
import LoginPage from './components/IngredientInput';
import HomePage from './components/RecipeDisplay';
import SeriesPage from './components/LoadingSpinner';
import PaymentModal from './components/PaymentModal';
import PlayerPage from './components/PlayerPage';
import ProfilePage from './components/ProfilePage';
import BetaWarningModal from './components/BetaWarningModal';

type View = 'landing' | 'login' | 'home' | 'series' | 'player' | 'profile';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('landing');
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [playingEpisode, setPlayingEpisode] = useState<{ series: Series, episode: Episode } | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<{
        amount: number;
        itemName: string;
        onSuccess: () => void;
    } | null>(null);
    const [showBetaWarning, setShowBetaWarning] = useState(false);
    
    // Helper function to hash passwords using the browser's built-in crypto API
    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    useEffect(() => {
        // Beta warning logic
        if (!sessionStorage.getItem('betaWarningDismissed')) {
            setShowBetaWarning(true);
        }

        const loggedInUserEmail = localStorage.getItem('dragon_fire_session');
        if (loggedInUserEmail) {
            const usersStr = localStorage.getItem('dragon_fire_users');
            const users = usersStr ? JSON.parse(usersStr) : {};
            let currentUser = users[loggedInUserEmail];

            if (currentUser) {
                // Data migration for existing users
                if (currentUser.watchedGoTEpisodes !== undefined && !currentUser.watchedEpisodes) {
                    const watchedIds = Array.from({ length: currentUser.watchedGoTEpisodes }, (_, i) => i + 1);
                    currentUser.watchedEpisodes = watchedIds;
                    delete currentUser.watchedGoTEpisodes;
                }
                 if (!currentUser.purchasedEpisodes) currentUser.purchasedEpisodes = [];
                 if (!currentUser.watchedEpisodes) currentUser.watchedEpisodes = [];
                 if (!currentUser.name) currentUser.name = '';
                 if (!currentUser.country) currentUser.country = '';
                 if (!currentUser.city) currentUser.city = '';
                 if (!currentUser.phoneNumber) currentUser.phoneNumber = '';


                setUser(currentUser);
                setView('home');
                updateUserInStorage(currentUser); // Save migrated user data
            }
        }

        const fetchSeriesData = async () => {
            const data = await getSeries();
            setSeriesList(data);
        };
        fetchSeriesData();
    }, []);

    const handleRegister = async (email: string, password: string, name: string, country: string, city: string, phoneNumber: string): Promise<{ success: boolean; message: string }> => {
        const usersStr = localStorage.getItem('dragon_fire_users');
        const users = usersStr ? JSON.parse(usersStr) : {};

        if (users[email]) {
            return { success: false, message: 'El correo electrónico ya está registrado.' };
        }

        const passwordHash = await hashPassword(password);
        const newUser: User = {
            id: Date.now().toString(),
            email: email,
            passwordHash: passwordHash,
            name,
            country,
            city,
            phoneNumber,
            watchedEpisodes: [],
            unlockedHoD: false,
            purchasedEpisodes: [],
        };
        users[email] = newUser;
        localStorage.setItem('dragon_fire_users', JSON.stringify(users));

        return { success: true, message: '¡Registro exitoso! Ahora puedes iniciar sesión.' };
    };


    const handleLogin = async (email: string, password: string) => {
        const usersStr = localStorage.getItem('dragon_fire_users');
        const users = usersStr ? JSON.parse(usersStr) : {};
        
        let currentUser = users[email];
        const passwordHash = await hashPassword(password);

        if (currentUser && currentUser.passwordHash === passwordHash) {
            localStorage.setItem('dragon_fire_session', email);
            if (!currentUser.purchasedEpisodes) currentUser.purchasedEpisodes = [];
            if (!currentUser.watchedEpisodes) currentUser.watchedEpisodes = [];
            setUser(currentUser);
            setView('home');
        } else {
            throw new Error("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dragon_fire_session');
        setUser(null);
        setView('landing');
        setPlayingEpisode(null);
        setSelectedSeriesId(null);
    };
    
    const handleUpdateProfile = async (updatedDetails: Pick<User, 'name' | 'country' | 'city' | 'phoneNumber'>): Promise<{ success: boolean, message: string }> => {
        if (!user) return { success: false, message: "No hay usuario activo." };

        const updatedUser = { ...user, ...updatedDetails };
        setUser(updatedUser);
        updateUserInStorage(updatedUser);

        return { success: true, message: "Perfil actualizado con éxito." };
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
        if (!user) return { success: false, message: "No hay usuario activo." };

        const currentPasswordHash = await hashPassword(currentPassword);
        if (currentPasswordHash !== user.passwordHash) {
            return { success: false, message: "La contraseña actual es incorrecta." };
        }
        
        const newPasswordHash = await hashPassword(newPassword);
        const updatedUser = { ...user, passwordHash: newPasswordHash };
        setUser(updatedUser);
        updateUserInStorage(updatedUser);

        return { success: true, message: "Contraseña actualizada con éxito." };
    };
    
    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeriesId(seriesId);
        setView('series');
    };

    const updateUserInStorage = (updatedUser: User) => {
        const usersStr = localStorage.getItem('dragon_fire_users');
        const users = usersStr ? JSON.parse(usersStr) : {};
        users[updatedUser.email] = updatedUser;
        localStorage.setItem('dragon_fire_users', JSON.stringify(users));
    };

    const handleUnlockHoD = () => {
        const onSuccess = () => {
            if (user) {
                const updatedUser = { ...user, unlockedHoD: true };
                setUser(updatedUser);
                updateUserInStorage(updatedUser);
                alert("'La Casa del Dragón' ha sido desbloqueada.");
                setPaymentDetails(null);
            }
        };

        setPaymentDetails({
            amount: 2.00,
            itemName: "Desbloquear 'La Casa del Dragón'",
            onSuccess: onSuccess,
        });
    };

    const handlePurchaseEpisode = (seriesId: string, episode: Episode, price: number) => {
        if (!user) return;
        const series = seriesList.find(s => s.id === seriesId);
        if (!series) return;

        const onSuccess = () => {
            const updatedUser = {
                ...user,
                purchasedEpisodes: [...(user.purchasedEpisodes || []), episode.id],
            };
            setUser(updatedUser);
            updateUserInStorage(updatedUser);
            alert(`Episodio "${episode.title}" comprado exitosamente.`);
            setPaymentDetails(null);
        };

        setPaymentDetails({
            amount: price,
            itemName: `${series.title} - ${episode.title}`,
            onSuccess: onSuccess,
        });
    };

    const handlePurchaseDownload = (seriesId: string, episode: Episode, price: number) => {
        const series = seriesList.find(s => s.id === seriesId);
        if (!series) return;

        const onSuccess = () => {
            alert(`Simulando descarga de "${episode.title}"...`);
            setPaymentDetails(null);
        };

        setPaymentDetails({
            amount: price,
            itemName: `Descarga de "${series.title} - ${episode.title}"`,
            onSuccess: onSuccess,
        });
    };

    const handlePlayEpisode = async (seriesId: string, episode: Episode) => {
        const series = await getSeriesById(seriesId);
        if(series) {
            setPlayingEpisode({ series, episode });
            setView('player');
        }
    };
    
    const handleEpisodeWatched = (episodeId: number) => {
        if (user && !user.watchedEpisodes.includes(episodeId)) {
            const updatedUser = {
                ...user,
                watchedEpisodes: [...user.watchedEpisodes, episodeId],
            };
            setUser(updatedUser);
            updateUserInStorage(updatedUser);
        }
    };

    const handleDismissBetaWarning = () => {
        sessionStorage.setItem('betaWarningDismissed', 'true');
        setShowBetaWarning(false);
    };


    const renderContent = () => {
        switch (view) {
            case 'landing':
                return <LandingPage onLoginClick={() => setView('login')} />;
            case 'login':
                return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
            case 'home':
                if (user) {
                    return <HomePage series={seriesList} user={user} onSelectSeries={handleSelectSeries} onUnlockHoD={handleUnlockHoD} />;
                }
                return null;
            case 'series':
                 if (user && selectedSeriesId) {
                    return <SeriesPage 
                        seriesId={selectedSeriesId} 
                        user={user} 
                        onBack={() => setView('home')} 
                        onPurchaseEpisode={(episode, price) => handlePurchaseEpisode(selectedSeriesId, episode, price)}
                        onPurchaseDownload={(episode, price) => handlePurchaseDownload(selectedSeriesId, episode, price)}
                        onPlayEpisode={(episode) => handlePlayEpisode(selectedSeriesId, episode)}
                        />;
                }
                return null;
            case 'player':
                if (playingEpisode) {
                    return <PlayerPage 
                        series={playingEpisode.series}
                        episode={playingEpisode.episode}
                        onBack={() => setView('series')}
                        onEpisodeWatched={() => handleEpisodeWatched(playingEpisode.episode.id)}
                    />
                }
                 return null;
            case 'profile':
                 if (user) {
                    return <ProfilePage 
                        user={user} 
                        seriesList={seriesList}
                        onBack={() => setView('home')}
                        onChangePassword={handleChangePassword}
                        onUpdateProfile={handleUpdateProfile}
                        />
                 }
                 return null;
            default:
                return <LandingPage onLoginClick={() => setView('login')} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {user && !['player', 'landing', 'login'].includes(view) && <Header user={user} onLogout={handleLogout} onViewProfile={() => setView('profile')} />}
            <main>
                {renderContent()}
            </main>
            {showBetaWarning && <BetaWarningModal onDismiss={handleDismissBetaWarning} />}
            {paymentDetails && (
                <PaymentModal
                    amount={paymentDetails.amount}
                    itemName={paymentDetails.itemName}
                    onSuccess={paymentDetails.onSuccess}
                    onClose={() => setPaymentDetails(null)}
                />
            )}
        </div>
    );
};

export default App;