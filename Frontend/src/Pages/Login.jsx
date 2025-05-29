import React from 'react';
import LoginForm from '../Components/LoginForm';
function Login(props) {
    const {setIslogged}=props;
    return (
        <div>
            <LoginForm setIslogged={setIslogged}/>
        </div>
    );
}

export default Login;