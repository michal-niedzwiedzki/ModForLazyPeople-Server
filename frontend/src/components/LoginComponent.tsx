import React from 'react'
import './LoginComponent.css'
import {getWebsocket, setWebsocket} from "../App";
import WebSocket from 'ws'
import {sha256} from "../utils";

function login() {
    const username = document.getElementById('login-username') as HTMLInputElement;
    const password = document.getElementById('login-password') as HTMLInputElement;

    const headers = {
        username: username.value,
        password: sha256(password.value)
    }

    setWebsocket(new WebSocket());
}

const LoginComponent = () => {
    if (getWebsocket()) return ( <div></div> );
    return (
        <div className={"login-container"}>
            <h2>Login</h2>

            <div className={"login-inputs"}>
                <p>Username</p>
                <input id={"login-username"} type="text" placeholder="Username" />
                <p>Password</p>
                <input id={"login-password"} type="password" placeholder="Password" />
                <button className="login-button" onClick={login}>Login</button>
            </div>
        </div>
    )
}

export default LoginComponent;