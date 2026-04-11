import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { ShowsProvider } from "./context/ShowsContext";
import { SettingsProvider } from "./context/SettingsContext";
import { SyncProvider } from "./context/SyncContext";
import { UserGate } from "./components/UserGate";
import { Layout } from "./components/layout";
import { Dashboard, Watchlist, ShowDetail, Settings } from "./pages";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <UserGate>
          <SettingsProvider>
            <ShowsProvider>
              <SyncProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="watchlist" element={<Watchlist />} />
                    <Route path="show/:id" element={<ShowDetail />} />
                    <Route path="settings" element={<Settings />} />
                    {/* Redirect old routes */}
                    <Route path="history" element={<Navigate to="/" replace />} />
                    <Route path="new-episodes" element={<Navigate to="/" replace />} />
                    <Route path="search" element={<Navigate to="/watchlist" replace />} />
                  </Route>
                </Routes>
              </SyncProvider>
            </ShowsProvider>
          </SettingsProvider>
        </UserGate>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
