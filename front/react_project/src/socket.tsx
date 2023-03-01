import socketIOClient from 'socket.io-client'
import { accountService } from './services/account.service'

const socket = socketIOClient('localhost:3000', {
    transports: ['websocket'],
    auth: { token: accountService.getToken() }
});

export default socket;