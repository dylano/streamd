import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useShows } from "../context/ShowsContext";
import { useEpisodes } from "../hooks/useEpisodes";
import { useTMDBShow, useTMDBSeason, parseStreamingProviders } from "../hooks/useTMDB";
import { EpisodeRow, ProviderPicker } from "../components/shows";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { StarRating } from "../components/ui/StarRating";
import { getPosterUrl, getLogoUrl } from "../utils/images";
import styles from "./ShowDetail.module.css";

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_Y = 80;
let pendingSlideDir: "left" | "right" | null = null;

function buildSortString(str: string) {
  return str.replace(/^(a|an|the)\s+/i, "");
}

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
  const [confirmingDashboardRemoval, setConfirmingDashboardRemoval] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(show?.notes ?? "");
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const sortedShows = [...shows].sort((a, b) => {
    const aD = a.status === "deactivated" ? 1 : 0;
    const bD = b.status === "deactivated" ? 1 : 0;
    if (aD !== bD) return aD - bD;
    return buildSortString(a.name).localeCompare(buildSortString(b.name));
  });
  const currentIdx = sortedShows.findIndex((s) => s.id === Number(id));
  const prevId = currentIdx > 0 ? sortedShows[currentIdx - 1].id : null;
  const nextId = currentIdx < sortedShows.length - 1 ? sortedShows[currentIdx + 1].id : null;

  useLayoutEffect(() => {
    if (pendingSlideDir) {
      setSlideDir(pendingSlideDir);
      pendingSlideDir = null;
    }
  }, [id]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
      if (dy > SWIPE_MAX_Y || Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (dx < 0 && nextId !== null) {
        pendingSlideDir = "left";
        navigate(`/show/${nextId}`);
      } else if (dx > 0 && prevId !== null) {
        pendingSlideDir = "right";
        navigate(`/show/${prevId}`);
      }
    },
    [navigate, nextId, prevId],
  );

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  useEffect(() => {
    if (show) {
      void fetchEpisodes();
      void fetchTMDBShow(show.tmdb_id);
    }
  }, [show, fetchEpisodes, fetchTMDBShow]);

  useEffect(() => {
    if (!editingNotes) setNotesValue(show?.notes ?? "");
  }, [show?.notes, editingNotes]);

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

  async function handleSaveNotes() {
    if (!show) return;
    try {
      await updateShow(show.id, { notes: notesValue.trim() || null });
    } finally {
      setEditingNotes(false);
    }
  }

  async function handleRateShow(rating: number) {
    if (!show) return;
    await updateShow(show.id, { rating });
  }

  async function handleSetProvider(streaming_service: string) {
    if (!show) return;
    await updateShow(show.id, { streaming_service });
    setPickingProvider(false);
  }

  async function handleDelete() {
    if (!show) return;
    await deleteShow(show.id);
    navigate("/watchlist");
  }

  async function handleDeactivate() {
    if (!show) return;
    await updateShow(show.id, { status: "deactivated" });
    navigate("/watchlist");
  }

  async function handleReactivate() {
    if (!show) return;
    await updateShow(show.id, { status: "watchlist" });
  }

  async function handleToggleWatched(episodeId: number, watched: boolean) {
    await markWatched(episodeId, watched);
    await refresh();
  }

  const slideClass =
    slideDir === "left" ? styles.slideLeft : slideDir === "right" ? styles.slideRight : "";

  return (
    <div
      ref={pageRef}
      className={`${styles.page} ${slideClass}`}
      onAnimationEnd={() => setSlideDir(null)}
    >
      <div className={styles.header}>
        {posterUrl && <img src={posterUrl} alt={show.name} className={styles.poster} />}
        <div className={styles.info}>
          <StarRating rating={show.rating} onChange={handleRateShow} />
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
            <div className={styles.providers}>
              <button
                className={styles.providerButton}
                onClick={() => setPickingProvider(true)}
                title="Set streaming service"
                type="button"
              >
                <svg
                  className={styles.providerLogo}
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    width="30"
                    height="30"
                    x="1"
                    y="1"
                    rx="6"
                    fill="none"
                    stroke="var(--text)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x="16"
                    y="22"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="600"
                    fill="var(--text)"
                  >
                    ?
                  </text>
                </svg>
              </button>
            </div>
          )}

          {show.overview && <p className={styles.overview}>{show.overview}</p>}

          {editingNotes ? (
            <div className={styles.notesEditor}>
              <textarea
                className={styles.notesTextarea}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleSaveNotes}
                autoFocus
                placeholder="Write your notes…"
              />
              <button
                type="button"
                className={styles.notesSaveButton}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSaveNotes}
              >
                Save
              </button>
            </div>
          ) : show.notes ? (
            <div className={styles.notesDisplay} onClick={() => setEditingNotes(true)}>
              <h3 className={styles.notesHeader}>My notes</h3>
              <p className={styles.notesText}>{show.notes}</p>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addNotesLink}
              onClick={() => setEditingNotes(true)}
            >
              Add notes
            </button>
          )}

          <div className={styles.meta}>
            {show.status === "deactivated" ? (
              <button
                onClick={handleReactivate}
                className={styles.resumeButton}
                type="button"
              >
                Resume Watching
              </button>
            ) : (
              <button
                onClick={() => setConfirmingDashboardRemoval(true)}
                className={styles.deleteButton}
                type="button"
              >
                Stop Watching
              </button>
            )}
            <button
              onClick={() => setConfirmingDelete(true)}
              className={styles.deleteButton}
              type="button"
            >
              Delete Show
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

      {confirmingDelete && (
        <ConfirmDialog
          message={`Delete "${show.name}" from your account?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {confirmingDashboardRemoval && (
        <ConfirmDialog
          message={`Remove "${show.name}" episodes from your dashboard?`}
          confirmLabel="Remove"
          onConfirm={handleDeactivate}
          onCancel={() => setConfirmingDashboardRemoval(false)}
        />
      )}
    </div>
  );
}
