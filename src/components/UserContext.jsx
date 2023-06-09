import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';


export const UserContext = createContext({});
export function UserContextProvider({children}){
    const [username, setUserName] = useState(null);
    const [id, setId] = useState(null);
    const navigate = useNavigate();

    useEffect(()=>{
            axios.get('/profile').then(response=>{
                const Userdata = response.data;
                const {username, userId} = Userdata
                setUserName(username);
                setId(userId);
            }).catch(error=>{
                console.log(error);
                if (error.response && error.response.status === 401) {
                    // Reset user data to null
                    setUserName(null);
                    setId(null);
                    navigate("/login");

                }else{
                    console.log(error);
                    navigate("/login");

                }
            })
        }, []);

    return(
    <UserContext.Provider value={{username, setUserName, id, setId}}>
        {children}
    </UserContext.Provider>
    )
}