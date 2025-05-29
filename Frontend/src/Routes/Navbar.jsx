import React from 'react';
import { Link } from 'react-router-dom';
import Style from './Navbar.module.css'
function Navbar(props) {
    const {islogged, setIslogged}=props;
    const logout=(e)=>{
        e.preventDefault();
        localStorage.removeItem("Current_User");
        localStorage.removeItem("User_role");
        localStorage.removeItem("token");
        localStorage.removeItem("islogged");
        setIslogged(false);
    }
    return (
        <div className={Style.navbar}>
            <Link to='/' className={Style.nav_element}>Home</Link>
            <Link to='/blogs' className={Style.nav_element}>Blogs</Link>
            {islogged?<Link to='/corner' className={Style.nav_element}>Writers Corner</Link>:""}
            {islogged?<p className={Style.nav_element} onClick={logout}>Logout</p>:<Link to='/login' className={Style.nav_element}>Login</Link>}
        </div>
    );
}

export default Navbar;