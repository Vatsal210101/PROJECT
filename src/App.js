import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home';
import EditorPage from './Pages/EditorPage';
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <>
    <Toaster position="top-right" toastOptions={{
      success: {
        theme: {
          primary: 'green',
        },
      },
    }} />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/editor/:roomId" element={<EditorPage/>}></Route>
      </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
