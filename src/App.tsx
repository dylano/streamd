import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShowsProvider } from "./context/ShowsContext";
import { Layout } from "./components/layout";
import { Dashboard, Watchlist, ShowDetail } from "./pages";

function App() {
  return (
    <BrowserRouter>
      <ShowsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="show/:id" element={<ShowDetail />} />
            {/* Redirect old routes */}
            <Route path="history" element={<Navigate to="/" replace />} />
            <Route path="new-episodes" element={<Navigate to="/" replace />} />
            <Route path="search" element={<Navigate to="/watchlist" replace />} />
            <Route path="settings" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ShowsProvider>
    </BrowserRouter>
  );
}

export default App;
