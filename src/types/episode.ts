export interface Episode {
  id: number;
  show_id: number;
  tmdb_id: number | null;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  runtime: number | null;
  watched: boolean;
  watched_at: string | null;
}

export interface UnwatchedEpisode {
  id: number;
  show_id: number;
  show_name: string;
  show_poster_path: string | null;
  show_network: string | null;
  show_current_season: number | null;
  show_current_episode: number | null;
  tmdb_id: number | null;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  runtime: number | null;
}

export interface CreateEpisodeInput {
  show_id: number;
  tmdb_id?: number | null;
  season_number: number;
  episode_number: number;
  name?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}
