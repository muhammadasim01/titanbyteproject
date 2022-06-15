import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
require("dotenv").config();
const jwt = require("jsonwebtoken");

export default function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.sendStatus(401);
  }
  jwt.verify(
    token,
    process.env.TOKEN_SECRET_KEY as string,
    (err: JsonWebTokenError, result: any) => {
      if (err) return res.sendStatus(403);
      req.body.user = result;
      next();
    }
  );
}
