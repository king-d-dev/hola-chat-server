import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { WEB_URL } from '../config';
import { getAuthenticatedUserDetails } from '../middlewares/get-authenticated-user-info';
import { requireAuth } from '../middlewares/require-auth';
import { SocketEvent, User } from '../types';

type SocketNextFunc = (err?: ExtendedError | undefined) => void;

declare module 'http' {
  interface IncomingMessage {
    user: User;
  }
}

const adaptSocketToExpressMiddleWares =
  (middleware: Function) => (socket: Socket, next: SocketNextFunc) =>
    middleware(socket.request, {}, next);

export default function (server: HttpServer) {
  const io = new Server(server, { cors: { origin: WEB_URL } });
  io.use(adaptSocketToExpressMiddleWares(requireAuth));
  io.use(adaptSocketToExpressMiddleWares(getAuthenticatedUserDetails));

  io.on('connection', function (socket) {
    console.log('new user connected');

    // Get all messages for the currently selected user
    socket.on(SocketEvent.GET_SELECTED_USER_MESSAGES, function () {});
  });

  // Automatically join users to a room of their own email so all their connected devices are synced
  // and broadcast a users disconnection when all their devices are disconnected/offline
  // if at least one of a users devices is still online, do not broadcast their disconnection
  io.on('connection', function (socket) {
    const { email } = socket.request.user;
    socket.join(email);
  });

  // Get all connected users
  io.on('connection', function (socket) {
    const users = [];
    const currentUser = socket.request.user;

    for (let [id, _socket] of io.of('/').sockets) {
      const user = _socket.request.user;
      if (currentUser.email === user.email) continue;

      users.push(user);
    }

    socket.emit(SocketEvent.ACTIVE_USERS, users);
  });
}
