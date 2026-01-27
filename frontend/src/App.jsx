import { ContourLayer } from "@deck.gl/aggregation-layers";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";

import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LinearLoader } from "./components/Loading";
import { UserWidget } from "./components/UserWidget";
import { DiseaseTogglePanel, getDiseaseColorRGBA } from "./components/DiseaseTogglePanel";
import { MapLegend } from "./components/MapLegend";
import { SymptomReportButton } from "./components/SymptomReportButton";
import { SymptomReportDrawer } from "./components/SymptomReportDrawer";

const { VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_ID, VITE_BACKEND_URL } = import.meta.env;

const LOADING_TIME_LIMIT = 2000;
const DEFAULT_ZOOM = 6;
const CALIFORNIA_CENTER = { lat: 37.0, lng: -120.0 };

function DeckGLOverlay(props) {
  const map = useMap();
  const overlay = useMemo(() => new GoogleMapsOverlay(props));

  useEffect(() => {
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map]);

  overlay.setProps(props);
  return null;
}

function App() {
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState({
    center: CALIFORNIA_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="w-screen h-dscreen">
      {ready ? (
        <>
          <APIProvider apiKey={VITE_GOOGLE_MAPS_API_KEY}>
            <CustomMap camera={camera} setCamera={setCamera} />
          </APIProvider>
          <UserWidget />
        </>
      ) : (
        <LoadingScreen />
      )}
    </main>
  );
}

function CustomMap({ camera, setCamera }) {
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [predictions, setPredictions] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleCameraChange = useCallback((e) => setCamera(e.detail));

  // Fetch predictions from API
  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${VITE_BACKEND_URL}/predictions?disease=${selectedDisease}`);
        const data = await response.json();

        if (data.success) {
          setPredictions(data.coordinates);
          setMetadata(data.metadata);
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
        // Fallback to test data
        const fallbackData = await fetch("/testdata.json").then(r => r.json());
        setPredictions(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [selectedDisease]);

  // Create heatmap layer with disease-specific colors
  const heatmapLayer = useMemo(() => {
    const color = getDiseaseColorRGBA(selectedDisease);

    return new ContourLayer({
      id: `ContourLayer-${selectedDisease}`,
      data: predictions,
      cellSize: 200,
      getPosition: (d) => d,
      getWeight: 1,
      contours: [{ threshold: [0, 100], color, zIndex: 1 }],
      updateTriggers: {
        getPosition: predictions,
      },
    });
  }, [predictions, selectedDisease]);

  return (
    <>
      <Map
        colorScheme="DARK"
        {...camera}
        onCameraChanged={handleCameraChange}
        disableDefaultUI={false}
        keyboardShortcuts={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        {!isLoading && <DeckGLOverlay layers={[heatmapLayer]} />}
      </Map>

      {/* UI Overlays */}
      <DiseaseTogglePanel
        selectedDisease={selectedDisease}
        onDiseaseChange={setSelectedDisease}
      />
      <MapLegend
        selectedDisease={selectedDisease}
        metadata={{ ...metadata, count: predictions.length }}
      />
      <SymptomReportButton onClick={() => setIsDrawerOpen(true)} />
      <SymptomReportDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center gap-6 p-4 md:p-8 h-full">
      <p className="font-semibold text-4xl md:text-5xl text-center">
        Outbreak Predictor
      </p>
      <div className="w-full max-w-xs md:max-w-sm">
        <LinearLoader />
      </div>
    </div>
  );
}

export default App;
