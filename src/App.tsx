/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { InferencePage } from "./pages/InferencePage";
import { ModelsPage } from "./pages/ModelsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black w-full overflow-x-hidden text-white font-sans selection:bg-white/20">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inference" element={<InferencePage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Routes>
      </div>
    </Router>
  );
}
