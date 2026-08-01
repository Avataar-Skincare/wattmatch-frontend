import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GeneratorRegisterPage from './pages/GeneratorRegisterPage';
import ConsumerRegisterPage from './pages/ConsumerRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/renewablesGenerator" element={<GeneratorRegisterPage />} />
        <Route path="/ciBuyer" element={<ConsumerRegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
