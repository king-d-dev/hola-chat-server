import { CustomError } from "./custom-error";

export class UnAuthorizedErrror extends CustomError {
  statusCode = 401;

  constructor() {
    super("Not Authorized");

    Object.setPrototypeOf(this, UnAuthorizedErrror.prototype);
  }

  format() {
    return [{ message: "Not Authorized" }];
  }
}
