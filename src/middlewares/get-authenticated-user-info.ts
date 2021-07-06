import axios from 'axios';
import { RequestHandler } from 'express';
import { AUTH0_DOMAIN } from '../config';

export const getAuthenticatedUserDetails: RequestHandler = async (req, res, next) => {
  const bearerToken = req.headers.authorization;
  const { data } = await axios.get(`${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: bearerToken },
  });

  req.user = data;
  next();
};
