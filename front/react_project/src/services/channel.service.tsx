import Axios from "./caller.service"

let getAllChannels = () => {
    return Axios.get("/chennels");
}

export const channelService = {
    getAllChannels
}