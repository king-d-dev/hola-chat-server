import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { WEB_URL } from '../config';
import { getAuthenticatedUserDetails } from '../middlewares/get-authenticated-user-info';
import { requireAuth } from '../middlewares/require-auth';
import { Message, MessageDocument } from '../models';
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

  // broadcast to all others that a new user has joined
  io.on('connection', function (socket) {
    const currentUser = socket.request.user;
    console.log('new user connected -- ', currentUser.email);
    socket.broadcast.emit(SocketEvent.NEW_USER_CONNECTED, currentUser);
  });

  // handle users disconnection when all their devices are disconnected/offline
  // if at least one of a users devices is still online, do not broadcast their disconnection
  io.on('connection', function (socket) {
    socket.on('disconnect', async function () {
      const currentUser = socket.request.user;
      console.log('disconnecting ', currentUser.email);

      const matchingSockets = await io.in(currentUser.email).allSockets();
      const isDisconnected = matchingSockets.size === 0;
      if (isDisconnected) socket.broadcast.emit(SocketEvent.USER_DISCONNECTED, currentUser);
    });
  });

  // Automatically join users to a room of their own email so all their connected devices are synced
  io.on('connection', function (socket) {
    const { email } = socket.request.user;
    console.log('Joining room ', email);
    socket.join(email);
  });

  // handle sending and receiving messages
  io.on('connection', function (socket) {
    socket.on(
      SocketEvent.MESSAGE,
      async function (message: MessageDocument, acknowlementFunc: Function) {
        const savedMessage = await Message.build(message).save();

        socket.to(message.recipient).emit(SocketEvent.MESSAGE, savedMessage);

        // also sync the message accross the senders devices.
        socket.broadcast.to(message.sender).emit(SocketEvent.MESSAGE, savedMessage);

        acknowlementFunc({ delivered: true });
      }
    );
  });

  // Get all messages for the currently selected user
  io.on('connection', function (socket) {
    socket.on(SocketEvent.SELECTED_USER_MESSAGES, async function (selectedUser: User) {
      const currentUser = socket.request.user;
      const msgParticipants = [currentUser.email, selectedUser.email];

      const messages = await Message.find({
        $or: [{ sender: { $in: msgParticipants } }, { recipient: { $in: [selectedUser.email] } }],
      });

      console.log('ROOMS', socket.rooms);
      io.in(currentUser.email).emit(SocketEvent.SELECTED_USER_MESSAGES, messages);
    });
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
