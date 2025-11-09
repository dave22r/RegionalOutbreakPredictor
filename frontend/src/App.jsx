import { ContourLayer } from "@deck.gl/aggregation-layers";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";

import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LinearLoader } from "./components/Loading";
import { UserWidget } from "./components/UserWidget";

const { VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_ID } = import.meta.env;

const LOADING_TIME_LIMIT = 2000;
const DEFAULT_ZOOM = 12;

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
    center: { lat: 37.8, lng: -122.4 },
    zoom: DEFAULT_ZOOM,
  });
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCamera({
          center: { lat: coords.latitude, lng: coords.longitude },
          zoom: DEFAULT_ZOOM,
        });
        setReady(true);
      },
      () => setReady(true),
      {
        enableHighAccuracy: false,
        timeout: LOADING_TIME_LIMIT,
        maximumAge: 3600000,
      }
    );
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
  const handleCameraChange = useCallback((e) => setCamera(e.detail));

  const heatmapLayer = new ContourLayer({
    id: "ContourLayer2",
    data: "/testdata.json",
    cellSize: 200,
    getPosition: (d) => d,
    getWeight: 1,
    contours: [{ threshold: [0, 100], color: [251, 110, 112, 128], zIndex: 1 }],
  });
  return (
    <Map
      mapId={VITE_GOOGLE_MAPS_ID}
      renderingType="VECTOR"
      colorScheme="DARK"
      {...camera}
      onCameraChanged={handleCameraChange}
      disableDefaultUI={true}
      keyboardShortcuts={false}
    >
      <DeckGLOverlay layers={[heatmapLayer]} />
    </Map>
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
