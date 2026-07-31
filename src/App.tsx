import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GeneratorRegisterPage from './pages/GeneratorRegisterPage';
import ConsumerRegisterPage from './pages/ConsumerRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generatorForm" element={<GeneratorRegisterPage />} />
        <Route path="/consumerForm" element={<ConsumerRegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
