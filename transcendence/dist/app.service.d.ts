export interface Movie {
    id: number;
    name: string;
    year: number;
}
export declare class AppService {
    private movies;
    getMovies(): Movie[];
}
