import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import MapView from "../components/MapView";
import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const [pins, setPins] = useState([]);
  const [mapCenter, setMapCenter] = useState([7.8731, 80.7718]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchMarker, setSearchMarker] = useState(null);
  const [showPins, setShowPins] = useState(true);
  const [placePinMode, setPlacePinMode] = useState(false);
  const nav = useNavigate();

  const loadPins = async () => {
    const { data } = await supabase
      .from("pins")
      .select("*, fabricators(*)")
      .order("created_at", { ascending: false });
    setPins(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) nav("/");
    });
    loadPins();
  }, []);

  // Add pin with confirmation
  const addPin = async (lat, lng) => {
    if (!placePinMode) return; // only allow adding in placePinMode
    const confirmAdd = window.confirm("Do you want to add a pin here?");
    if (!confirmAdd) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("pins").insert({
      user_id: user.id,
      lat,
      lng,
      title: "New Pin",
      description: "",
    });

    loadPins();
  };

  const updatePin = async (id, title, description) => {
    await supabase.from("pins").update({ title, description }).eq("id", id);
    loadPins();
  };

  const addFabricator = async (pin_id, name, address, phone) => {
    await supabase.from("fabricators").insert({ pin_id, name, address, phone });
    loadPins();
  };

  // Search location suggestions
  const searchLocation = async (query) => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      alert("Error searching location.");
    }
  };

  const selectSearchResult = (lat, lon) => {
    const coords = [parseFloat(lat), parseFloat(lon)];
    setMapCenter(coords);
    setSearchMarker(coords);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/");
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2.5 flex flex-col gap-1.5 bg-white shadow-sm border-b">
        <div className="flex gap-1.5">
          <input
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchLocation(e.target.value);
            }}
          />
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              placePinMode
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
            onClick={() => setPlacePinMode(!placePinMode)}
          >
            {placePinMode ? "Exit Place Pin Mode" : "Place Pin Mode"}
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showPins
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
            onClick={() => setShowPins(!showPins)}
          >
            {showPins ? "Hide Pins" : "Show Pins"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border border-gray-300 max-h-36 overflow-y-auto bg-white rounded-lg shadow-lg z-50">
            {searchResults.map((item) => (
              <div
                key={item.place_id}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => selectSearchResult(item.lat, item.lon)}
              >
                <div className="text-sm text-gray-800">{item.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1">
        <MapView
          center={mapCenter}
          pins={showPins ? pins : []} // show or hide pins
          searchMarker={searchMarker}
          onMapClick={addPin}
          onUpdatePin={updatePin}
          onAddFabricator={addFabricator}
        />
      </div>

      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-full shadow-lg 
    hover:bg-red-700 active:scale-95 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
