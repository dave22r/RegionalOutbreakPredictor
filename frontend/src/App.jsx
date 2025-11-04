import { DeckGL } from "@deck.gl/react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import "./App.css";
import { useEffect, useState } from "react";
import { LinearLoader } from "./components/Loading";

const { VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_ID } = import.meta.env;

const LOADING_TIME_LIMIT = 3000;
const DEFAULT_ZOOM = 12;

function App() {
  const [ready, setReady] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: DEFAULT_ZOOM,
    minZoom: 2,
  });
  useEffect(() => {
    let loadTimedout = false;
    const timer = setTimeout(() => {
      loadTimedout = true;
      setReady(true);
    }, LOADING_TIME_LIMIT);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!loadTimedout) {
          clearTimeout(timer);
          setViewState({
            ...viewState,
            latitude: coords.latitude,
            longitude: coords.longitude,
            zoom: DEFAULT_ZOOM,
          });
          setReady(true);
        }
      },
      () => setReady(true)
    );
  }, []);

  return (
    <main className="w-screen h-dscreen">
      {ready ? (
        <APIProvider apiKey={VITE_GOOGLE_MAPS_API_KEY}>
          <DeckGL
            initialViewState={viewState}
            controller={{
              inertia: 300,
              scrollZoom: {
                smooth: true,
                speed: 0.1,
              },
              dragRotate: false,
            }}
          >
            <Map
              mapId={VITE_GOOGLE_MAPS_ID}
              renderingType="VECTOR"
              colorScheme="DARK"
            />
          </DeckGL>
        </APIProvider>
      ) : (
        <LoadingScreen />
      )}
    </main>
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
