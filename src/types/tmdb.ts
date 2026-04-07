export interface TMDBSearchResult {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  popularity: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  episodes?: TMDBEpisode[];
}

export interface TMDBSeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  episodes: TMDBEpisode[];
}

export interface TMDBShowDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string | null;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  vote_average: number;
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
}

export interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TMDBWatchProviderRegion {
  link: string;
  flatrate?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
  rent?: TMDBWatchProvider[];
}

export interface TMDBWatchProvidersResponse {
  id: number;
  results: Record<string, TMDBWatchProviderRegion>;
}
