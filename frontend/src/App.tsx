import React from 'react';
import './App.css';
import {Header} from "./components/Header";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ConsolePage from "./pages/ConsolePage";
import HomePage from "./pages/HomePage";
import WebSocket from 'ws';

let websocketConnection: WebSocket;

export function setWebsocket(ws: WebSocket) {
    websocketConnection = ws;
}

export function getWebsocket() { return websocketConnection; }

function App() {
  return (
    <div className="App">
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path={"/"} element={<HomePage />} />
                <Route path={"/console"} element={<ConsolePage/>} />
            </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
