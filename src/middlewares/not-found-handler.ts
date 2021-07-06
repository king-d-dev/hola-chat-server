import { RequestHandler } from "express";
import { NotFoundError } from "../errors/not-found-errror";

export const notFoundHandler: RequestHandler = (req, res, next) => {
  throw new NotFoundError();
};
