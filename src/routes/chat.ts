import { Router, RequestHandler } from 'express';
import { Message, MessageDocument } from '../models';
import { BadRequestError } from '../errors/bad-request-error';

const router = Router();

const addChat: RequestHandler = async (req, res) => {
  return res.json({ success: true });
};

router.post('/add', addChat);

export default router;
