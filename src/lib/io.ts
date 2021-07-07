import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { WEB_URL } from '../config';
import { getAuthenticatedUserDetails } from '../middlewares/get-authenticated-user-info';
import { requireAuth } from '../middlewares/require-auth';
import { BlackList, Message, MessageDocument } from '../models';
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
  io.on('connection', async function (socket) {
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
    socket.join(email);
  });

  // handle sending and receiving messages
  io.on('connection', function (socket) {
    socket.on(
      SocketEvent.MESSAGE,
      async function (message: MessageDocument, acknowlementFunc: Function) {
        const blockedByRecipient = await BlackList.findOne({ blacklister: message.recipient });
        console.log('BLOCKED BY', blockedByRecipient);
        if (blockedByRecipient) return;

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

      io.in(currentUser.email).emit(SocketEvent.SELECTED_USER_MESSAGES, messages);
    });
  });

  // Get all connected users
  io.on('connection', async function (socket) {
    const users = [];
    const currentUser = socket.request.user;
    const currentUserBlackListers = (await BlackList.find({
      blacklistee: currentUser.email,
    }).select('blacklister')) as unknown[] as string[];

    for (let [id, _socket] of io.of('/').sockets) {
      const user = _socket.request.user;
      if (currentUser.email === user.email) continue;

      //   exclude users who have blacklisted the current user
      if (currentUserBlackListers.includes(user.email)) return;

      users.push(user);
    }

    socket.emit(SocketEvent.ACTIVE_USERS, users);
  });

  //   handle user blocking
  io.on('connection', function (socket) {
    socket.on(SocketEvent.BLOCK_USER, async function (userToBeBlocked, acknowlementFunc) {
      const currentUser = socket.request.user;
      const existing = await BlackList.findOne({
        blacklistee: currentUser.email,
        blacklister: userToBeBlocked.email,
      });
      if (existing) return;

      BlackList.build({
        blacklistee: userToBeBlocked.email,
        blacklister: currentUser.email,
      }).save();

      //   after blocking the user, send an event the blocker's connected devices
      io.in(currentUser.email).emit(SocketEvent.BLOCK_USER, userToBeBlocked);

      // also send an event to the blocked users connected devices
      io.in(userToBeBlocked.email).emit(SocketEvent.BLOCKED, currentUser);
    });
  });

  // Get a users list of blacklisters
  io.on('connection', function (socket) {
    socket.on(SocketEvent.BLACK_LISTERS, async function () {
      const currentUser = socket.request.user;

      const currentUserBlackListers = (
        await BlackList.find({ blacklistee: currentUser.email }, { blacklister: true })
      ).map((each) => each.blacklister);

      io.in(currentUser.email).emit(SocketEvent.BLACK_LISTERS, currentUserBlackListers);
    });
  });

  // Get a users blocked list
  io.on('connection', function (socket) {
    socket.on(SocketEvent.BLACK_LIST, async function () {
      const currentUser = socket.request.user;

      const currentUserBlackList = await BlackList.find(
        { blacklister: currentUser.email },
        { blacklistee: true }
      );
      io.in(currentUser.email).emit(SocketEvent.BLACK_LIST, currentUserBlackList);
    });
  });
}
