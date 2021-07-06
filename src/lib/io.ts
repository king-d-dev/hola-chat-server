import http from 'http';
import { Server } from 'socket.io';
import { WEB_URL } from '../config';
import { SocketEvent } from '../types';

export default function (server: http.Server) {
  const io = new Server(server, { cors: { origin: WEB_URL } });

  io.on('connection', function (socket) {
    console.log('new user connected');
  });

  // Get all messages for the currently selected user
  io.on('connection', function (socket) {
    socket.on(SocketEvent.GET_ALL_MESSAGES, function () {});
  });

  io.on('connection', function (socket) {
    const users = [];

    for (let [id, _socket] of io.of('/').sockets) {
      users.push(id);
    }

    socket.emit(SocketEvent.ACTIVE_USERS, users);
    console.log('UUU', users);
  });
}
