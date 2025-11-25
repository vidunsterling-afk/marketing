import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  );
}
