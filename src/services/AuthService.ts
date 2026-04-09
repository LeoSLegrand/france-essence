import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma";

const JWT_EXPIRES_IN = "7d";

export default class AuthService {
  private getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set");
    }

    return secret;
  }

  async signup(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      },
      select: {
        id: true,
        email: true
      }
    });

    const token = jwt.sign({ sub: user.id, email: user.email }, this.getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, this.getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN
    });

    return {
      user: {
        id: user.id,
        email: user.email
      },
      token
    };
  }
}
