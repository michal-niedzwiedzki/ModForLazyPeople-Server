import React from 'react'
import LoginComponent from "../components/LoginComponent";
import './HomePage.css'

class HomePage extends React.Component {
    render() {
        return (
            <div className={"homepage-container"}>
                <LoginComponent />
            </div>
        )
    }
}

export default HomePage;