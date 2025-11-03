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
    
    useEffect(() => {
        const fetchSeriesData = async () => {
            const data = await getSeries();
            setSeriesList(data);
        };
        fetchSeriesData();
    }, []);

    const handleLogin = (email: string) => {
        // Mock user login. In a real app, this would be an API call.
        setUser({
            id: '1',
            email: email,
            watchedGoTEpisodes: 10, // Mock: user has watched 10 episodes
            unlockedHoD: false,
        });
        setView('home');
    };

    const handleLogout = () => {
        setUser(null);
        setView('landing');
    };
    
    const handleSelectSeries = (seriesId: string) => {
        setSelectedSeriesId(seriesId);
        setView('series');
    };

    const handleUnlockHoD = () => {
        // In a real app, this would trigger a payment flow.
        if (window.confirm("¿Deseas pagar $2.00 para desbloquear 'La Casa del Dragón' ahora?")) {
            if (user) {
                setUser({ ...user, unlockedHoD: true });
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