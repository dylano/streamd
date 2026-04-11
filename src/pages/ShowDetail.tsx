import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useShows } from "../context/ShowsContext";
import { useEpisodes } from "../hooks/useEpisodes";
import { useTMDBShow, useTMDBSeason, parseStreamingProviders } from "../hooks/useTMDB";
import { EpisodeRow, ProviderPicker } from "../components/shows";
import { getPosterUrl, getLogoUrl } from "../utils/images";
import styles from "./ShowDetail.module.css";

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shows, updateShow, deleteShow, refresh } = useShows();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [syncing, setSyncing] = useState(false);

  const show = shows.find((s) => s.id === Number(id));
  const { fetchEpisodes, syncEpisodes, markWatched, getEpisodesBySeason } = useEpisodes(
    show?.id ?? null,
  );
  const { show: tmdbShow, fetchShow: fetchTMDBShow } = useTMDBShow();
  const { fetchSeason } = useTMDBSeason();
  const [pickingProvider, setPickingProvider] = useState(false);

  useEffect(() => {
    if (show) {
      void fetchEpisodes();
      void fetchTMDBShow(show.tmdb_id);
    }
  }, [show, fetchEpisodes, fetchTMDBShow]);

  // Default to the most recent season when show data loads
  useEffect(() => {
    if (tmdbShow?.seasons) {
      const maxSeason = Math.max(
        ...tmdbShow.seasons.filter((s) => s.season_number > 0).map((s) => s.season_number),
      );
      if (maxSeason > 0) setSelectedSeason(maxSeason);
    }
  }, [tmdbShow]);

  if (!show) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Show not found</p>
      </div>
    );
  }

  const seasonEpisodes = getEpisodesBySeason(selectedSeason);
  const seasons = [...(tmdbShow?.seasons.filter((s) => s.season_number > 0) ?? [])].reverse();
  const posterUrl = getPosterUrl(show.poster_path, "w342");

  async function handleSyncSeason(seasonNumber: number) {
    if (!show || syncing) return;

    setSyncing(true);
    try {
      const seasonData = await fetchSeason(show.tmdb_id, seasonNumber);
      if (seasonData?.episodes) {
        await syncEpisodes(
          seasonData.episodes.map((ep) => ({
            tmdb_id: ep.id,
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            name: ep.name,
            air_date: ep.air_date,
            runtime: ep.runtime,
          })),
        );
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleSetProvider(streaming_service: string) {
    if (!show) return;
    await updateShow(show.id, { streaming_service });
    setPickingProvider(false);
  }

  async function handleDelete() {
    if (!show) return;
    if (confirm("Are you sure you want to remove this show?")) {
      await deleteShow(show.id);
      navigate("/watchlist");
    }
  }

  async function handleToggleWatched(episodeId: number, watched: boolean) {
    await markWatched(episodeId, watched);
    await refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {posterUrl && <img src={posterUrl} alt={show.name} className={styles.poster} />}
        <div className={styles.info}>
          <h1>{show.name}</h1>
          {show.first_air_date && (
            <p className={styles.year}>{show.first_air_date.split("-")[0]}</p>
          )}

          {pickingProvider ? (
            <ProviderPicker
              onSelect={handleSetProvider}
              onCancel={() => setPickingProvider(false)}
            />
          ) : parseStreamingProviders(show.streaming_service)[0] ? (
            <div className={styles.providers}>
              <button
                className={styles.providerButton}
                onClick={() => setPickingProvider(true)}
                title="Change streaming service"
                type="button"
              >
                <img
                  src={
                    getLogoUrl(parseStreamingProviders(show.streaming_service)[0].logo_path) ?? ""
                  }
                  alt={parseStreamingProviders(show.streaming_service)[0].name}
                  className={styles.providerLogo}
                />
              </button>
            </div>
          ) : (
            <button
              className={styles.setProvider}
              onClick={() => setPickingProvider(true)}
              type="button"
            >
              Set streaming service
            </button>
          )}

          {show.overview && <p className={styles.overview}>{show.overview}</p>}

          <div className={styles.meta}>
            {show.current_season && show.current_episode ? (
              <span className={styles.bookmark}>
                Next: S{show.current_season}E{show.current_episode}
              </span>
            ) : (
              <span className={styles.bookmark}>Caught up</span>
            )}
            <button
              onClick={handleDelete}
              className={styles.deleteButton}
              title="Remove show"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {seasons.length > 0 && (
        <div className={styles.seasons}>
          <div className={styles.seasonTabs}>
            {seasons.map((season) => (
              <button
                key={season.season_number}
                className={`${styles.seasonTab} ${selectedSeason === season.season_number ? styles.active : ""}`}
                onClick={() => setSelectedSeason(season.season_number)}
                type="button"
              >
                S{season.season_number}
              </button>
            ))}
          </div>

          <div className={styles.episodeList}>
            <div className={styles.episodeHeader}>
              <span>Season {selectedSeason}</span>
              <button
                onClick={() => handleSyncSeason(selectedSeason)}
                disabled={syncing}
                className={styles.syncButton}
                type="button"
              >
                {syncing ? "Syncing..." : "Sync Episodes"}
              </button>
            </div>

            {seasonEpisodes.length === 0 ? (
              <p className={styles.empty}>
                No episodes synced. Click "Sync Episodes" to fetch from TMDB.
              </p>
            ) : (
              [...seasonEpisodes]
                .reverse()
                .map((episode) => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    onToggleWatched={handleToggleWatched}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
