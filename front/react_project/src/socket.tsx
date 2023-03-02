import socketIOClient from 'socket.io-client'
import { accountService } from './services/account.service'

const socket = socketIOClient('localhost:3000', {
    transports: ['websocket'],
    auth: { token: accountService.getToken() }
});

console.log('CREATION SOCKET', socket);

export default socket;