export interface User {
    id: string;
    email: string;
    // Tracks progress to implement business logic
    watchedGoTEpisodes: number;
    unlockedHoD: boolean;
}

export interface Episode {
    id: number;
    title: string;
    season: number;
    episode: number;
    description: string;
}

export interface Series {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    episodes: Episode[];
}
