import { GoogleGenAI, Type } from "@google/genai";
import type { Series, Episode } from '../types';

// This service provides mock data for the series, now enhanced with Gemini.

// WARNING: Do not expose your API key in client-side code in a real production application.
// This is done here for demonstration purposes. Use environment variables on a server instead.
const apiKey = "AIzaSyC-OzK6ghSc_ZMO1rIA21XE0Ox8ql4z7xk";
const ai = new GoogleGenAI({ apiKey: apiKey });


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
                description: `Resumen del S${seasonNumber}E${episodeInSeason}...`,
                videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Placeholder
            });
            episodeCounter++;
        }
    }
    return episodes;
};

const gameOfThronesEpisodes = generateGoTEpisodes();
const totalGoTEpisodes = gameOfThronesEpisodes.length;

const totalHoDEpisodes = 10;
const houseOfTheDragonEpisodes = Array.from({ length: totalHoDEpisodes }, (_, i) => ({
    id: i + 1 + totalGoTEpisodes, // Ensure HoD episode IDs are unique and follow GoT's
    title: `Capítulo ${i + 1}`,
    season: 1,
    episode: i + 1,
    description: `Resumen del S1E${i + 1}...`,
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' // Placeholder
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

// Helper to prevent API calls on every load by caching
const seriesCache = new Map<string, Series>();

export const getSeries = async (): Promise<Series[]> => {
    // This function can remain simple and fast, returning the basic structure.
    // The detailed fetching can happen in getSeriesById.
    return Promise.resolve(seriesData);
};

export const getSeriesById = async (id: string): Promise<Series | undefined> => {
    const seriesStructure = seriesData.find(s => s.id === id);
    if (!seriesStructure) return undefined;
    
    // Check cache first to avoid redundant API calls
    if (seriesCache.has(id)) {
        return seriesCache.get(id);
    }

    try {
        const descriptionPrompt = `Generate a compelling, one-sentence description in Spanish for the TV series '${seriesStructure.title}'. It should be exciting and hook the reader.`;
        const episodePrompt = `Generate brief, one-sentence summaries in Spanish for each episode of the TV series "${seriesStructure.title}".
        Provide the response as a valid JSON array of objects, where each object has "id" (number) and "description" (string).
        The episode IDs for this series are from ${seriesStructure.episodes[0].id} to ${seriesStructure.episodes[seriesStructure.episodes.length - 1].id}.`;

        const [descriptionResponse, episodesResponse] = await Promise.all([
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: descriptionPrompt,
            }),
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: episodePrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.NUMBER },
                                description: { type: Type.STRING }
                            },
                            required: ["id", "description"]
                        }
                    }
                }
            })
        ]);

        let generatedSummaries: {id: number, description: string}[] = [];
        try {
           generatedSummaries = JSON.parse(episodesResponse.text);
        } catch(e) {
            console.error("Failed to parse JSON from Gemini response:", episodesResponse.text);
            throw e; 
        }

        const updatedEpisodes = seriesStructure.episodes.map(ep => {
            const summary = generatedSummaries.find(s => s.id === ep.id);
            return summary ? { ...ep, description: summary.description } : ep;
        });

        const updatedSeries = { 
            ...seriesStructure, 
            description: descriptionResponse.text || seriesStructure.description,
            episodes: updatedEpisodes 
        };
        
        seriesCache.set(id, updatedSeries); // Cache the result
        return updatedSeries;

    } catch (error) {
        console.error(`Error fetching details for ${seriesStructure.title} from Gemini:`, error);
        return seriesStructure; // Fallback to mock data on error
    }
};