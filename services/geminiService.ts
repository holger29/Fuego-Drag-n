// This service provides mock data for the series.
import type { Series } from '../types';

const generateGoTEpisodes = () => {
    const episodes = [];
    // Episodes per season for Game of Thrones
    const seasonLengths = [10, 10, 10, 10, 10, 10, 7, 6]; 
    let episodeCounter = 1;

    for (let seasonIndex = 0; seasonIndex < seasonLengths.length; seasonIndex++) {
        const seasonNumber = seasonIndex + 1;
        for (let episodeInSeason = 1; episodeInSeason <= seasonLengths[seasonIndex]; episodeInSeason++) {
            episodes.push({
                id: episodeCounter,
                title: `Capítulo ${episodeInSeason}`,
                season: seasonNumber,
                episode: episodeInSeason,
                description: `Resumen del S${seasonNumber}E${episodeInSeason}...`
            });
            episodeCounter++;
        }
    }
    return episodes;
};

const gameOfThronesEpisodes = generateGoTEpisodes();

const totalHoDEpisodes = 10;
const houseOfTheDragonEpisodes = Array.from({ length: totalHoDEpisodes }, (_, i) => ({
    id: i + 1,
    title: `Capítulo ${i + 1}`,
    season: 1,
    episode: i + 1,
    description: `Resumen del S1E${i + 1}...`
}));

const seriesData: Series[] = [
    {
        id: 'got',
        title: 'Game of Thrones',
        description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
        posterUrl: 'https://image.tmdb.org/t/p/w1280/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
        episodes: gameOfThronesEpisodes,
    },
    {
        id: 'hod',
        title: 'House of the Dragon',
        description: 'The story of the House Targaryen set 200 years before the events of Game of Thrones.',
        posterUrl: 'https://image.tmdb.org/t/p/w1280/zNZEtOc2j2s4cCNjJ0k0n2vC8z4.jpg',
        episodes: houseOfTheDragonEpisodes,
    }
];

export const getSeries = (): Promise<Series[]> => {
    return Promise.resolve(seriesData);
};

export const getSeriesById = (id: string): Promise<Series | undefined> => {
    return Promise.resolve(seriesData.find(s => s.id === id));
};