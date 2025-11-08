import React, { useState } from 'react';
import type { Series, User, Episode } from '../types';

interface EpisodeListProps {
    series: Series;
    user: User;
    onPurchaseEpisode: (episode: Episode, price: number) => void;
    onPurchaseDownload: (episode: Episode, price: number) => void;
    onPlayEpisode: (episode: Episode) => void;
}

const EpisodeList: React.FC<EpisodeListProps> = ({ series, user, onPurchaseEpisode, onPurchaseDownload, onPlayEpisode }) => {
    const [openSeason, setOpenSeason] = useState<number | null>(1);

    const handleToggleSeason = (seasonNumber: number) => {
        setOpenSeason(prevOpenSeason => (prevOpenSeason === seasonNumber ? null : seasonNumber));
    };

    const handleEpisodeClick = (episode: Episode, isLocked: boolean, price: number) => {
        if (isLocked) {
            onPurchaseEpisode(episode, price);
        } else {
            onPlayEpisode(episode);
        }
    };

    const handleDownloadClick = (episode: Episode, price: number) => {
        onPurchaseDownload(episode, price);
    };

    const getPricing = (seriesId: string, episodeId: number) => {
        let isLocked = false;
        let watchPrice = 0;
        let downloadPrice = 0;

        if (seriesId === 'got') {
            isLocked = episodeId > 4;
            watchPrice = 0.10;
            downloadPrice = 0.50;
        } else if (seriesId === 'hod') {
            isLocked = episodeId > 4;
            watchPrice = 0.20;
            downloadPrice = 0.60;
        }

        // Unlock if already purchased
        if (user.purchasedEpisodes?.includes(episodeId)) {
            isLocked = false;
        }

        return { isLocked, watchPrice, downloadPrice };
    };

    // FIX: Group episodes by season. By explicitly typing the accumulator with a generic
    // on `reduce`, we ensure `episodesBySeason` has the correct type. This
    // prevents TypeScript from inferring `episodes` as `unknown` in the `.map` call below.
    // @google-genai-fix: Correctly type the `reduce` accumulator by applying a type assertion to the initial value. This fixes the "Untyped function call" error.
    const episodesBySeason = series.episodes.reduce((acc, episode) => {
        const seasonKey = String(episode.season);
        if (!acc[seasonKey]) {
            acc[seasonKey] = [];
        }
        acc[seasonKey].push(episode);
        return acc;
    }, {} as Record<string, Episode[]>);

    const hasMultipleSeasons = Object.keys(episodesBySeason).length > 1;

    if (!hasMultipleSeasons) {
        return (
            <div>
                <h3 className="text-3xl font-semibold mb-4 border-b-2 border-gray-700 pb-2 font-cinzel">Episodios</h3>
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                    {series.episodes.map((ep) => {
                        const { isLocked, watchPrice, downloadPrice } = getPricing(series.id, ep.id);
                        return (
                            <div key={ep.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700/70 transition-colors duration-200">
                                <div>
                                    <h4 className="font-bold text-lg">{ep.title}</h4>
                                    <p className="text-sm text-gray-400">Temporada {ep.season}</p>
                                </div>
                                {/* @google-genai-fix: Correct Tailwind CSS class from sm-gap-3 to sm:gap-3 */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                    {isLocked ? (
                                        <span className="text-xs font-bold bg-yellow-500 text-black py-1 px-2 rounded">${watchPrice.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-xs font-bold bg-green-500 text-black py-1 px-2 rounded">GRATIS</span>
                                    )}
                                    <button onClick={() => handleEpisodeClick(ep, isLocked, watchPrice)} className={`w-10 h-10 flex items-center justify-center rounded text-white font-semibold ${isLocked ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`} title={isLocked ? "Ver (Bloqueado)" : "Ver"}>
                                        {isLocked ? <i className="fa-solid fa-lock"></i> : <i className="fa-solid fa-play"></i>}
                                    </button>
                                    <button onClick={() => handleDownloadClick(ep, downloadPrice)} title={`Descargar ($${downloadPrice.toFixed(2)})`} className="w-10 h-10 flex items-center justify-center rounded text-white font-semibold bg-blue-600 hover:bg-blue-700">
                                        <i className="fa-solid fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-3xl font-semibold mb-4 border-b-2 border-gray-700 pb-2 font-cinzel">Episodios por Temporada</h3>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                {Object.entries(episodesBySeason).map(([season, episodes]) => {
                    const seasonNumber = parseInt(season);
                    const isOpen = openSeason === seasonNumber;

                    return (
                        <div key={season} className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => handleToggleSeason(seasonNumber)}
                                className="w-full text-left p-4 flex justify-between items-center bg-gray-700/80 hover:bg-gray-700 transition-colors"
                            >
                                <h4 className="font-bold text-xl">Temporada {season}</h4>
                                <i className={`fa-solid fa-chevron-down transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            {isOpen && (
                                <div className="p-2 space-y-2">
                                    {episodes.map((ep) => {
                                        const { isLocked, watchPrice, downloadPrice } = getPricing(series.id, ep.id);
                                        return (
                                            <div key={ep.id} className="bg-gray-900/60 p-3 rounded-md flex justify-between items-center hover:bg-gray-700/70 transition-colors duration-200">
                                                <div>
                                                    <h4 className="font-bold text-lg">E{ep.episode}: {ep.title}</h4>
                                                    <p className="text-sm text-gray-400">{ep.description}</p>
                                                </div>
                                                {/* @google-genai-fix: Correct Tailwind CSS class from sm-gap-3 to sm:gap-3 */}
                                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                    {isLocked ? (
                                                        <span className="text-xs font-bold bg-yellow-500 text-black py-1 px-2 rounded">${watchPrice.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-xs font-bold bg-green-500 text-black py-1 px-2 rounded">GRATIS</span>
                                                    )}
                                                    <button onClick={() => handleEpisodeClick(ep, isLocked, watchPrice)} className={`w-10 h-10 flex items-center justify-center rounded text-white font-semibold ${isLocked ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`} title={isLocked ? "Ver (Bloqueado)" : "Ver"}>
                                                        {isLocked ? <i className="fa-solid fa-lock"></i> : <i className="fa-solid fa-play"></i>}
                                                    </button>
                                                    <button onClick={() => handleDownloadClick(ep, downloadPrice)} title={`Descargar ($${downloadPrice.toFixed(2)})`} className="w-10 h-10 flex items-center justify-center rounded text-white font-semibold bg-blue-600 hover:bg-blue-700">
                                                        <i className="fa-solid fa-download"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EpisodeList;