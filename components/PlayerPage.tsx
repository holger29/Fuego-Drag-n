import React, { useRef, useEffect, useState } from 'react';
import type { Series, Episode } from '../types';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PlayerPageProps {
    series: Series;
    episode: Episode;
    onBack: () => void;
    onEpisodeWatched: () => void;
}

const PlayerPage: React.FC<PlayerPageProps> = ({ series, episode, onBack, onEpisodeWatched }) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const progressTrackedRef = useRef(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const fetchVideoDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const videoDocRef = doc(db, 'video_uploads', String(episode.id));
                const videoDocSnap = await getDoc(videoDocRef);

                if (videoDocSnap.exists()) {
                    const videoData = videoDocSnap.data();
                    if (videoData.videoUrl) {
                        setVideoUrl(videoData.videoUrl);
                    } else {
                        setError('La URL del video no está disponible en el registro.');
                    }
                } else {
                    setError('Este episodio aún no tiene un video disponible. Por favor, contacta al administrador.');
                }
            } catch (e: any) {
                console.error("Error al obtener los datos del video:", e);
                setError(`No se pudo cargar la información del video. ${e.message}`);
            }
            setIsLoading(false);
        };

        fetchVideoDetails();
    }, [episode.id]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        // Check if duration is valid to avoid division by zero or NaN
        if (video.duration && video.duration > 0) {
            const progress = (video.currentTime / video.duration) * 100;
            if (progress >= 80 && !progressTrackedRef.current) {
                onEpisodeWatched();
                progressTrackedRef.current = true;
            }
        }
    };

    const handleVideoError = () => {
        // This catches errors when the browser tries to load the source
        const err = videoRef.current?.error;
        console.error("Video Error Object:", err);
        
        let errorMessage = "El video no se pudo reproducir.";
        if (err) {
            if (err.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
                 errorMessage = "El archivo de video no se encuentra o el formato no es compatible.";
            } else if (err.code === 3) { // MEDIA_ERR_DECODE
                 errorMessage = "Error al decodificar el video.";
            } else if (err.code === 2) { // MEDIA_ERR_NETWORK
                 errorMessage = "Error de red al descargar el video.";
            }
        } else {
            // Sometimes the event fires without a specific error object populated yet, usually 404
             errorMessage = "No se pudo cargar el archivo de video. Verifique su conexión.";
        }
        
        setError(errorMessage);
    };

    const renderPlayer = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-white h-64">
                    <i className="fa-solid fa-circle-notch fa-spin text-5xl mb-4 text-red-600"></i>
                    <p className="text-lg font-cinzel">Cargando pergaminos antiguos...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="flex flex-col items-center justify-center text-center text-white bg-red-900/20 p-8 rounded-lg border border-red-800/50 max-w-2xl">
                    <i className="fa-solid fa-dragon text-6xl mb-4 text-red-500"></i>
                    <h3 className="text-2xl font-bold mb-2 font-cinzel">Video No Disponible</h3>
                    <p className="text-red-300 mb-6">{error}</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition">
                            Regresar
                        </button>
                        {videoUrl && (
                            <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition flex items-center gap-2"
                            >
                                <i className="fa-solid fa-external-link-alt"></i>
                                Ver en pestaña nueva
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        if (videoUrl) {
            return (
                <div className="w-full max-w-6xl bg-black rounded-lg shadow-2xl overflow-hidden border border-gray-800 relative aspect-video">
                     <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        controls
                        autoPlay
                        playsInline
                        controlsList="nodownload"
                        preload="metadata"
                        src={videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onError={handleVideoError}
                    >
                        Tu navegador no soporta la reproducción de video.
                    </video>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col z-20">
            <header className="w-full p-4 flex items-center justify-between bg-black bg-opacity-50 backdrop-blur-sm z-30">
                <button onClick={onBack} className="bg-gray-700/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> <span>Volver</span>
                </button>
                <div className="text-right hidden md:block">
                    <h1 className="text-xl font-bold font-cinzel text-yellow-500">{series.title}</h1>
                    <p className="text-sm text-gray-400">T{episode.season}:E{episode.episode} - {episode.title}</p>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black w-full h-full">
                {renderPlayer()}
            </main>

            <footer className="w-full p-6 bg-gray-900 bg-opacity-90 max-h-[25vh] overflow-y-auto border-t border-gray-800">
                <div className="max-w-6xl mx-auto">
                     <div className="md:hidden mb-2">
                        <h2 className="text-lg font-bold font-cinzel text-yellow-500">{series.title}</h2>
                        <p className="text-xs text-gray-400">T{episode.season}:E{episode.episode}</p>
                    </div>
                    <h2 className="text-2xl font-bold font-cinzel mb-2 text-white">{episode.title}</h2>
                    <p className="text-gray-300 leading-relaxed">{episode.description}</p>
                </div>
            </footer>
        </div>
    );
};

export default PlayerPage;