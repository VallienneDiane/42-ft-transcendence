import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userService } from "../services/user.service";
import "../styles/SearchUserBar.css"

export interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string
}

export default function SearchUserBar() {
    const [value, setValue] = useState<string>("");
    const [userNames, setUserNames] = useState<string[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        userService.getAllUsers()
        .then(response => {
            const users = response.data.map((user: UserData) => user.login);
            users.sort();
            setUserNames(users);
        })
        .catch(error => {
            console.log(error);
        })
    }, []);
    
    const displayList = (event: any) => {
        setValue(event.target.value);
        if (event.target.value) {
            setFilteredUsers(userNames.filter((user: string) => user.startsWith(event.target.value)));
        }
        else {
            setFilteredUsers([]);
        }
    }
    
    const onHover = (event: React.MouseEvent<Element, MouseEvent>) => {
        const target = event.target as HTMLElement;
        setValue(target.innerHTML);
        // setFilteredUsers(userNames.filter((user: string) => user.startsWith(event.target.value)));
    }
    
    const onClick = (event: React.MouseEvent<Element, MouseEvent>) => {
        const target = event.target as HTMLElement;
        navigate("/profile/" + target.innerHTML);
    }

    return (
        <div id="searchUserBar">
            <h2>Search User</h2>
            <form action="">
                <input type="text" onChange={displayList} onClick={displayList} value={value} placeholder="login..."/>
            </form>
            <ul>
                {filteredUsers.map((user: string) => (
                    <li key={user} onMouseEnter={onHover} onClick={onClick}>{user}</li>
                ))}
            </ul>
        </div>
    )
}