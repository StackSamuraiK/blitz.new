import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {Home} from "./pages/Home"
import { Builder } from './pages/Builder';
import { Analytics } from "@vercel/analytics/next"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Analytics />
      </Routes>
    </BrowserRouter>
  );
}

export default App;