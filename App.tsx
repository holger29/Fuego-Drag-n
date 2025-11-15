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
import AdminLoginPage from './components/AdminLoginPage';
import AdminPage from './components/AdminPage';
import { db } from './services/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';

type View = 'landing' | 'login' | 'home' | 'series' | 'player' | 'profile' | 'adminLogin' | 'admin';

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
    const [isAdmin, setIsAdmin] = useState(false);

    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    useEffect(() => {
        if (!sessionStorage.getItem('betaWarningDismissed')) {
            setShowBetaWarning(true);
        }

        const checkSession = async () => {
            const loggedInUserEmail = localStorage.getItem('dragon_fire_session');
            if (loggedInUserEmail) {
                const q = query(collection(db, "users"), where("email", "==", loggedInUserEmail));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const currentUser = { docId: userDoc.id, ...userDoc.data() } as User;
                    setUser(currentUser);
                    setView('home');
                } else {
                    handleLogout(); // Clean up if user is not in DB
                }
            }
        };

        checkSession();

        const fetchSeriesData = async () => {
            const data = await getSeries();
            setSeriesList(data);
        };
        fetchSeriesData();
    }, []);

    const handleRegister = async (email: string, password: string, name: string, country: string, city: string, phoneNumber: string): Promise<{ success: boolean; message: string }> => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: 'El correo electrónico ya está registrado.' };
        }

        const passwordHash = await hashPassword(password);
        const userId = Date.now().toString();
        const newUser: Omit<User, 'docId'> = {
            id: userId,
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
        
        await setDoc(doc(db, "users", userId), newUser);

        return { success: true, message: '¡Registro exitoso! Ahora puedes iniciar sesión.' };
    };

    const handleLogin = async (email: string, password: string) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
        }

        const userDoc = querySnapshot.docs[0];
        const currentUser = { docId: userDoc.id, ...userDoc.data() } as User;
        const passwordHash = await hashPassword(password);

        if (currentUser.passwordHash === passwordHash) {
            localStorage.setItem('dragon_fire_session', email);
            setUser(currentUser);
            setView('home');
        } else {
            throw new Error("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dragon_fire_session');
        setUser(null);
        setIsAdmin(false);
        setView('landing');
        setPlayingEpisode(null);
        setSelectedSeriesId(null);
    };

    const handleUpdateProfile = async (updatedDetails: Pick<User, 'name' | 'country' | 'city' | 'phoneNumber'>): Promise<{ success: boolean, message: string }> => {
        if (!user || !user.docId) return { success: false, message: "No hay usuario activo." };
        
        const userRef = doc(db, "users", user.docId);
        await updateDoc(userRef, updatedDetails);
        const updatedUser = { ...user, ...updatedDetails };
        setUser(updatedUser);

        return { success: true, message: "Perfil actualizado con éxito." };
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
        if (!user || !user.docId) return { success: false, message: "No hay usuario activo." };

        const currentPasswordHash = await hashPassword(currentPassword);
        if (currentPasswordHash !== user.passwordHash) {
            return { success: false, message: "La contraseña actual es incorrecta." };
        }
        
        const newPasswordHash = await hashPassword(newPassword);
        const userRef = doc(db, "users", user.docId);
        await updateDoc(userRef, { passwordHash: newPasswordHash });
        
        const updatedUser = { ...user, passwordHash: newPasswordHash };
        setUser(updatedUser);

        return { success: true, message: "Contraseña actualizada con éxito." };
    };
    
    const handleSaveFeedback = async (comment: string): Promise<{ success: boolean, message: string }> => {
        if (!user) return { success: false, message: "Debes iniciar sesión para enviar comentarios." };
    
        try {
            await addDoc(collection(db, "feedback"), {
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                comment,
                timestamp: Timestamp.fromDate(new Date()),
            });
            return { success: true, message: "¡Gracias por tu comentario! Tus datos serán estudiados para mejorar la calidad de nuestro sistema." };
        } catch (error) {
            console.error("Error writing document: ", error);
            return { success: false, message: "No se pudo enviar tu comentario. Inténtalo de nuevo." };
        }
    };

    const handleAdminLogin = async (email: string, pass: string): Promise<void> => {
        if (email === "holgereduardo777@gmail.com" && pass === "HHolger19") {
             setIsAdmin(true);
             setView('admin');
        } else {
            throw new Error("Credenciales de administrador incorrectas.");
        }
    };
    
    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeriesId(seriesId);
        setView('series');
    };

    const updateUserInDb = async (updatedUser: User) => {
        if (!updatedUser.docId) return;
        const userRef = doc(db, "users", updatedUser.docId);
        // Avoid writing docId into the document itself
        const { docId, ...userData } = updatedUser;
        await updateDoc(userRef, userData);
    };

    const handleUnlockHoD = () => {
        const onSuccess = () => {
            if (user) {
                const updatedUser = { ...user, unlockedHoD: true };
                setUser(updatedUser);
                updateUserInDb(updatedUser);
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
            updateUserInDb(updatedUser);
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
            updateUserInDb(updatedUser);
        }
    };

    const handleDismissBetaWarning = () => {
        sessionStorage.setItem('betaWarningDismissed', 'true');
        setShowBetaWarning(false);
    };


    const renderContent = () => {
        switch (view) {
            case 'landing':
                return <LandingPage onLoginClick={() => setView('login')} onAdminClick={() => setView('adminLogin')} />;
            case 'login':
                return <LoginPage onLogin={handleLogin} onRegister={handleRegister} onBackToLanding={() => setView('landing')} />;
            case 'adminLogin':
                return <AdminLoginPage onAdminLogin={handleAdminLogin} onBackToLanding={() => setView('landing')} />;
            case 'admin':
                return isAdmin ? <AdminPage onLogout={handleLogout} /> : <LandingPage onLoginClick={() => setView('login')} onAdminClick={() => setView('adminLogin')} />;
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
                        onSaveFeedback={handleSaveFeedback}
                        />
                 }
                 return null;
            default:
                return <LandingPage onLoginClick={() => setView('login')} onAdminClick={() => setView('adminLogin')} />;
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