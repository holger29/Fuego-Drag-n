import React, { useRef, useEffect, useState } from 'react';
import type { Series, Episode } from '../types';

interface PlayerPageProps {
    series: Series;
    episode: Episode;
    onBack: () => void;
    onEpisodeWatched: () => void;
}

const PlayerPage: React.FC<PlayerPageProps> = ({ series, episode, onBack, onEpisodeWatched }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasBeenWatched, setHasBeenWatched] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.duration > 0 && !hasBeenWatched) {
                const progress = (video.currentTime / video.duration) * 100;
                if (progress >= 80) {
                    onEpisodeWatched();
                    setHasBeenWatched(true); 
                }
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [onEpisodeWatched, hasBeenWatched]);

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col z-20">
            <header className="w-full p-4 flex items-center justify-between bg-black bg-opacity-50">
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Volver
                </button>
                <div className="text-right">
                    <h1 className="text-xl font-bold font-cinzel">{series.title}</h1>
                    <p className="text-sm text-gray-400">T{episode.season}:E{episode.episode} - {episode.title}</p>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                 <video
                    ref={videoRef}
                    className="w-full max-w-6xl max-h-[80vh] aspect-video"
                    src={episode.videoUrl}
                    controls
                    autoPlay
                >
                    Tu navegador no soporta el tag de video.
                </video>
            </main>

            <footer className="w-full p-6 bg-black bg-opacity-50 max-h-[25vh] overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold font-cinzel mb-2">{episode.title}</h2>
                    <p className="text-gray-300">{episode.description}</p>
                </div>
            </footer>
        </div>
    );
};

export default PlayerPage;