import React, { useState, useEffect } from 'react';
import type { Series, User } from '../types';
import { getSeriesById } from '../services/geminiService';
import EpisodeList from './ErrorMessage';

interface SeriesPageProps {
    seriesId: string;
    user: User;
    onBack: () => void;
}

const SeriesPage: React.FC<SeriesPageProps> = ({ seriesId, user, onBack }) => {
    const [series, setSeries] = useState<Series | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            const data = await getSeriesById(seriesId);
            setSeries(data || null);
            setLoading(false);
        };
        fetchSeries();
    }, [seriesId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
            </div>
        );
    }

    if (!series) {
        return <div className="min-h-screen flex items-center justify-center text-white">Serie no encontrada.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 pt-28">
             <div className="container mx-auto">
                <button onClick={onBack} className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Volver a la selección
                </button>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3 flex-shrink-0">
                        <img src={series.posterUrl} alt={series.title} className="rounded-lg shadow-lg w-full"/>
                    </div>
                    <div className="md:w-2/3">
                        <h2 className="text-5xl font-bold mb-4 font-cinzel">{series.title}</h2>
                        <p className="text-gray-300 mb-8">{series.description}</p>
                        <EpisodeList series={series} user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeriesPage;
