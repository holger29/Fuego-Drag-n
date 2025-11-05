import React, { useState, useEffect } from 'react';
import type { User, Series } from './types';
import { getSeries } from './services/geminiService';
import Header from './components/Header';
import LandingPage from './components/Welcome';
import LoginPage from './components/IngredientInput';
import HomePage from './components/RecipeDisplay';
import SeriesPage from './components/LoadingSpinner';

type View = 'landing' | 'login' | 'home' | 'series';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('landing');
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    
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
        // Check for a logged-in user in localStorage on initial load
        const loggedInUserEmail = localStorage.getItem('dragon_fire_session');
        if (loggedInUserEmail) {
            const usersStr = localStorage.getItem('dragon_fire_users');
            const users = usersStr ? JSON.parse(usersStr) : {};
            const currentUser = users[loggedInUserEmail];
            if (currentUser) {
                setUser(currentUser);
                setView('home');
            }
        }

        const fetchSeriesData = async () => {
            const data = await getSeries();
            setSeriesList(data);
        };
        fetchSeriesData();
    }, []);

    const handleLogin = async (email: string, password: string) => {
        const usersStr = localStorage.getItem('dragon_fire_users');
        const users = usersStr ? JSON.parse(usersStr) : {};
        
        const currentUser = users[email];
        const passwordHash = await hashPassword(password);

        if (currentUser) {
            // User exists, check password
            if (currentUser.passwordHash === passwordHash) {
                // Password matches, log in
                localStorage.setItem('dragon_fire_session', email);
                setUser(currentUser);
                setView('home');
            } else {
                // Password does not match
                alert("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
            }
        } else {
            // User doesn't exist, create (register) them
            const newUser: User = {
                id: Date.now().toString(),
                email: email,
                passwordHash: passwordHash,
                watchedGoTEpisodes: 0,
                unlockedHoD: false,
            };
            users[email] = newUser;
            localStorage.setItem('dragon_fire_users', JSON.stringify(users));
            
            // Set current session and log in
            localStorage.setItem('dragon_fire_session', email);
            setUser(newUser);
            setView('home');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dragon_fire_session');
        setUser(null);
        setView('landing');
    };
    
    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeriesId(seriesId);
        setView('series');
    };

    const handleUnlockHoD = () => {
        if (window.confirm("¿Deseas pagar $2.00 para desbloquear 'La Casa del Dragón' ahora?")) {
            if (user) {
                const updatedUser = { ...user, unlockedHoD: true };
                setUser(updatedUser);

                // Update user data in localStorage
                const usersStr = localStorage.getItem('dragon_fire_users');
                const users = usersStr ? JSON.parse(usersStr) : {};
                users[user.email] = updatedUser;
                localStorage.setItem('dragon_fire_users', JSON.stringify(users));

                alert("'La Casa del Dragón' ha sido desbloqueada.");
            }
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'landing':
                return <LandingPage onLoginClick={() => setView('login')} />;
            case 'login':
                return <LoginPage onLogin={handleLogin} />;
            case 'home':
                if (user) {
                    return <HomePage series={seriesList} user={user} onSelectSeries={handleSelectSeries} onUnlockHoD={handleUnlockHoD} />;
                }
                return null;
            case 'series':
                 if (user && selectedSeriesId) {
                    return <SeriesPage seriesId={selectedSeriesId} user={user} onBack={() => setView('home')} />;
                }
                return null;
            default:
                return <LandingPage onLoginClick={() => setView('login')} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {user && <Header user={user} onLogout={handleLogout} />}
            <main>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;