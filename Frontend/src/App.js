// import logo from './logo.svg';
import {useState } from 'react';
import './App.css';
import AllRoutes from './Routes/AllRoutes';
import Navbar from './Routes/Navbar';
function App() {
  const [islogged,setIslogged]=useState(false);
  return (
    <div className="App">
      <Navbar islogged={islogged} setIslogged={setIslogged}/>
      <AllRoutes islogged={islogged} setIslogged={setIslogged}/>
    </div>
  );
}

export default App;
