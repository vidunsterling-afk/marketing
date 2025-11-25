import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const highlightedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const activeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onClick, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapView({
  center,
  pins,
  searchMarker,
  onMapClick,
  onUpdatePin,
  onAddFabricator,
}) {
  const [fabInputs, setFabInputs] = useState({});
  const [pinEdits, setPinEdits] = useState({});
  const [activePin, setActivePin] = useState(null);
  const [windowPosition, setWindowPosition] = useState({ x: 40, y: 40 });
  const [fabOpen, setFabOpen] = useState({});
  const [pinDetailsOpen, setPinDetailsOpen] = useState({});

  const handlePinClick = (pin) => {
    setActivePin(pin);
  };

  const handleCloseWindow = () => {
    setActivePin(null);
    setPinEdits({});
    setFabInputs({});
  };

  const handleSavePin = async (pin) => {
    const tempTitle = pinEdits[pin.id]?.title ?? pin.title;
    const tempDesc = pinEdits[pin.id]?.description ?? pin.description;
    await onUpdatePin(pin.id, tempTitle, tempDesc);
    setPinEdits((prev) => ({ ...prev, [pin.id]: undefined }));
  };

  const handleAddFabricator = (pin) => {
    const { name, address, phone } = fabInputs[pin.id] || {};
    if (!name || !address) {
      alert("Please fill in required fields: Name and Address");
      return;
    }
    onAddFabricator(pin.id, name, address, phone || "");
    setFabInputs({
      ...fabInputs,
      [pin.id]: { name: "", address: "", phone: "" },
    });
  };

  const handleDragStart = (e) => {
    if (!e.target.classList.contains("drag-handle")) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = windowPosition.x;
    const startTop = windowPosition.y;

    const handleDrag = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setWindowPosition({
        x: startLeft + deltaX,
        y: startTop + deltaY,
      });
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center || [7.8731, 80.7718]}
        zoom={8}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler onClick={onMapClick} disabled={!!activePin} />

        {searchMarker && (
          <Marker
            position={searchMarker}
            icon={
              new L.Icon({
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                shadowUrl:
                  "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })
            }
          />
        )}

        {pins.map((pin) => {
          const isNearby =
            searchMarker &&
            getDistance(pin.lat, pin.lng, searchMarker[0], searchMarker[1]) <=
              5;

          const isActive = activePin?.id === pin.id;

          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={
                isActive ? activeIcon : isNearby ? highlightedIcon : defaultIcon
              }
              eventHandlers={{
                click: () => handlePinClick(pin),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Windows-style Detail Panel */}
      {activePin && (
        <div
          className="absolute top-0 left-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col max-h-[80vh]"
          style={{
            transform: `translate(${windowPosition.x}px, ${windowPosition.y}px)`,
            zIndex: 1000,
          }}
        >
          {/* Window Header */}
          <div
            className="drag-handle flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300 rounded-t-lg cursor-move select-none"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                Location Details
              </h3>
            </div>
            <button
              onClick={handleCloseWindow}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Pin Details Form */}
            {/* Collapsible Pin Details */}
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              {/* Header */}
              <button
                onClick={() =>
                  setPinDetailsOpen((prev) => ({
                    ...prev,
                    [activePin.id]: !prev[activePin.id],
                  }))
                }
                className="w-full flex items-center justify-between px-4 py-3 text-gray-800 font-medium text-sm"
              >
                <span>Pin Details</span>
                <span
                  className={`transition-transform ${
                    pinDetailsOpen?.[activePin.id] ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Collapsible Body */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  pinDetailsOpen?.[activePin.id]
                    ? "max-h-[500px] p-4"
                    : "max-h-0 p-0"
                }`}
              >
                <div className="space-y-4 mb-2">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      value={pinEdits[activePin.id]?.title ?? activePin.title}
                      onChange={(e) =>
                        setPinEdits({
                          ...pinEdits,
                          [activePin.id]: {
                            ...pinEdits[activePin.id],
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter location title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                      value={
                        pinEdits[activePin.id]?.description ??
                        activePin.description
                      }
                      onChange={(e) =>
                        setPinEdits({
                          ...pinEdits,
                          [activePin.id]: {
                            ...pinEdits[activePin.id],
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Add description or notes"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 
        rounded-md font-medium transition-colors duration-200 focus:outline-none 
        focus:ring-2 focus:ring-blue-500"
                    onClick={() => handleSavePin(activePin)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Fabricators Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">
                  Fabricators
                </h4>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {activePin.fabricators?.length || 0}
                </span>
              </div>

              {/* Add Fabricator Form */}
              {/* Collapsible Container */}
              <div className="bg-blue-50 rounded-lg border border-blue-200">
                {/* Header */}
                <button
                  onClick={() =>
                    setFabOpen((prev) => ({
                      ...prev,
                      [activePin.id]: !prev[activePin.id],
                    }))
                  }
                  className="w-full flex items-center justify-between px-4 py-3 text-blue-900 font-medium text-sm"
                >
                  <span>Add New Fabricator</span>
                  <span
                    className={`transition-transform ${
                      fabOpen?.[activePin.id] ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Collapsible Body */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    fabOpen?.[activePin.id]
                      ? "max-h-[500px] p-4"
                      : "max-h-0 p-0"
                  }`}
                >
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Company Name *"
                        value={fabInputs[activePin.id]?.name || ""}
                        onChange={(e) =>
                          setFabInputs({
                            ...fabInputs,
                            [activePin.id]: {
                              ...fabInputs[activePin.id],
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Address *"
                        value={fabInputs[activePin.id]?.address || ""}
                        onChange={(e) =>
                          setFabInputs({
                            ...fabInputs,
                            [activePin.id]: {
                              ...fabInputs[activePin.id],
                              address: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Phone Number"
                        value={fabInputs[activePin.id]?.phone || ""}
                        onChange={(e) =>
                          setFabInputs({
                            ...fabInputs,
                            [activePin.id]: {
                              ...fabInputs[activePin.id],
                              phone: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md 
        text-sm font-medium transition"
                      onClick={() => handleAddFabricator(activePin)}
                    >
                      Add Fabricator
                    </button>
                  </div>
                </div>
              </div>

              {/* Fabricators List */}
              {activePin.fabricators?.length > 0 ? (
                <div className="space-y-3 mt-6 max-h-40 overflow-y-auto">
                  {activePin.fabricators.map((fabricator) => (
                    <div
                      key={fabricator.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">
                            {fabricator.name}
                          </h5>
                          <p className="text-gray-600 text-xs mt-1">
                            {fabricator.address}
                          </p>
                          {fabricator.phone && (
                            <p className="text-blue-600 text-xs mt-1">
                              {fabricator.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg mb-6">
                  <svg
                    className="w-8 h-8 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    No fabricators added yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
