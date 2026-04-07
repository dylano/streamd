export type ShowStatus = "watching" | "watchlist" | "completed" | "dropped";

export interface Show {
  id: number;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  status: ShowStatus;
  streaming_service: string | null;
  total_seasons: number;
  total_episodes: number;
  current_season: number | null;
  current_episode: number | null;
  added_at: string;
  updated_at: string;
}

export interface CreateShowInput {
  tmdb_id: number;
  name: string;
  poster_path?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  status?: ShowStatus;
  streaming_service?: string | null;
  total_seasons?: number;
  total_episodes?: number;
  current_season?: number | null;
  current_episode?: number | null;
}

export interface UpdateShowInput {
  status?: ShowStatus;
  streaming_service?: string | null;
  current_season?: number | null;
  current_episode?: number | null;
}
