import { ErrorRequestHandler } from 'express';
import { CustomError } from '../errors/custom-error';
import { BadRequestError } from '../errors/bad-request-error';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log('EE', err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.format() });
  }

  const error = new BadRequestError(err.message || 'Request Failed');
  return res.status(500).send({ errors: error.format() });
};

export { errorHandler };
