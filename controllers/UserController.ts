import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { userObjectInterface } from "../types/dbObjectsTypes";
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 *
 * Utility functions
 * @returns jwtToken
 */
// function for generating jwt token
function generateToken(userId: number) {
  return jwt.sign(userId, process.env.TOKEN_SECRET_KEY);
}

/* Controller functions for handling the  functions that will handle the routes   */
const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const saltRounds = 10;
  bcrypt
    .hash(password, saltRounds)
    .then((data) => {
      User.insert(["email", "password"], [email, data])
        .then((result) => {
          return res.send(result);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  User.select(["user_id", "email", "password"])
    .where("email", "=", email)
    .get()
    .then((result: userObjectInterface[]) => {
      console.log(result);
      
      if (!result[0]) {
        return res.sendStatus(404);
      }

      bcrypt
        .compare(password, result[0].password)
        .then((data) => {
          if (!data) {
            return res.json({
              success: false,
              message: `Invalid password for the user ${email}`,
            });
          }
          console.log(result[0]);
          
          const token = generateToken(result[0].user_id);
          return res.json({
            success: true,
            message: "Token generated for the user",
            token,
          });
        })
        .catch((error) => {
          console.log(error);
          return res.send(error);
        });
    });
};

const getUserData = async (req: Request, res: Response) => {
  const { user } = req.body;
  try {
    const userData = await User.select(["email",'user_id'])
      .where("user_id", "=", user)
      .get();
    if (userData) {
      return res.json(userData[0]);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { registerUser, loginUser, getUserData };
