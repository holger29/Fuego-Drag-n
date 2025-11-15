export interface User {
    docId?: string; // Firestore document ID
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    country: string;
    city: string;
    phoneNumber: string;
    // Tracks progress to implement business logic
    watchedEpisodes: number[];
    unlockedHoD: boolean;
    purchasedEpisodes?: number[];
}

export interface Episode {
    id: number;
    title: string;
    season: number;
    episode: number;
    description: string;
    videoUrl: string;
}

export interface Series {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    episodes: Episode[];
}

export interface Feedback {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    comment: string;
    timestamp: any; // Allow for Firestore Timestamp object
}
