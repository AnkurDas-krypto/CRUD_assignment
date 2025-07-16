import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ItemList from './components/ItemList';
import ItemDetail from './components/ItemDetail';
import ItemForm from './components/ItemForm';
import Header from './components/Header';
import SpeechRecorder from './components/SpeechRecorder';
import UnderwritingDashboard from './components/UnderwritingDashboard';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<ItemList />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/add" element={<ItemForm />} />
            <Route path="/edit/:id" element={<ItemForm />} />
            <Route path="/speech" element={<SpeechRecorder />} />
            <Route path="/underwriting" element={<UnderwritingDashboard />} />
          </Routes>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
