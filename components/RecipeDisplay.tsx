import React from 'react';
import type { Series, User } from '../types';

interface HomePageProps {
    series: Series[];
    user: User;
    onSelectSeries: (seriesId: string) => void;
    onUnlockHoD: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ series, user, onSelectSeries, onUnlockHoD }) => {
    const got = series.find(s => s.id === 'got');
    const hod = series.find(s => s.id === 'hod');

    // Business logic: HOD is locked until all 73 episodes of GoT are watched.
    const gotEpisodesWatched = user.watchedEpisodes.filter(id => id <= 73).length;
    const isHodLocked = gotEpisodesWatched < 73 && !user.unlockedHoD;

    return (
        <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-28 min-h-screen">
             <h2 className="text-4xl font-bold text-center mb-10 text-white uppercase tracking-widest font-cinzel">Elige tu Saga</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {got && (
                    <div onClick={() => onSelectSeries(got.id)} className="group relative rounded-lg overflow-hidden shadow-2xl cursor-pointer transform hover:scale-105 transition-transform duration-300 aspect-[3/4]">
                         <img src={got.posterUrl} alt={got.title} className="w-full h-full object-cover"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent group-hover:bg-black group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-end p-6">
                            <h3 className="text-white text-2xl md:text-4xl font-bold font-cinzel mb-4">{got.title}</h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSeries(got.id);
                                }}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition duration-300 w-full text-center"
                            >
                                Ver Serie GoT
                            </button>
                         </div>
                    </div>
                )}
                {hod && (
                     <div onClick={() => !isHodLocked && onSelectSeries(hod.id)} className={`group relative rounded-lg overflow-hidden shadow-2xl transition-transform duration-300 aspect-[3/4] ${isHodLocked ? 'cursor-not-allowed' : 'cursor-pointer transform hover:scale-105'}`}>
                         <img src={hod.posterUrl} alt={hod.title} className={`w-full h-full object-cover ${isHodLocked ? 'filter grayscale' : ''}`}/>
                         
                         {isHodLocked ? (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-6 text-center">
                                <div className="text-white">
                                    <i className="fa-solid fa-lock text-4xl mb-4"></i>
                                    <h3 className="text-2xl font-bold font-cinzel">Bloqueado</h3>
                                    <p className="mt-2 mb-4">Debes ver los {73 - gotEpisodesWatched} episodios restantes de 'Juego de Tronos' o pagar para desbloquear.</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUnlockHoD();
                                        }}
                                        className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-300 transform hover:scale-105"
                                    >
                                        <i className="fa-solid fa-unlock-keyhole mr-2"></i>
                                        Desbloquear por $2.00
                                    </button>
                                </div>
                            </div>
                         ) : (
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent group-hover:bg-black group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-end p-6">
                                <h3 className="text-white text-2xl md:text-4xl font-bold font-cinzel">{hod.title}</h3>
                            </div>
                         )}
                    </div>
                )}
             </div>
        </div>
    );
};

export default HomePage;