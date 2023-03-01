import { createContext } from "react";
import User from "../models"

export const UserContext = createContext<User>({} as User);
 