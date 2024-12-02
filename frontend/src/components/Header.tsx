import React from 'react'
import './Header.css'
import {Link} from "react-router-dom";

export function Header() {
    return (
        <div className={"header"}>
            <div className={"options"}>
                <Link className={"option"} to={"/"}>HOME</Link>
                <Link className={"option"} to={"/console"}>CONSOLE</Link>
            </div>
        </div>
    )
}
