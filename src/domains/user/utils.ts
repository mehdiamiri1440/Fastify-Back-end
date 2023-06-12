import { User } from '$src/domains/user/models/User';
import permissions from '$src/permissions';
import { repo } from '$src/infra/utils/repo';
import { RolePermission } from '$src/domains/user/models/RolePermission';
import assert from 'assert';
import { compare } from 'bcrypt';
import { ACCESS_DENIED } from '$src/domains/user/routes/errors';
import { UserLogout } from '$src/domains/user/models/UserLogout';
import { FastifyInstance } from 'fastify';
import { FastifyJWT } from '@fastify/jwt';
const { TOKEN_TTL_SECONDS } = process.env;

if (TOKEN_TTL_SECONDS) {
  assert(Number(TOKEN_TTL_SECONDS) > 0, 'Invalid TOKEN_TTL_SECONDS');
}

const TTL = TOKEN_TTL_SECONDS ? Number(TOKEN_TTL_SECONDS) : 10 * 60; // 10 mins

export const GetLoginAndActiveUserByRefreshToken = async (
  app: FastifyInstance,
  token: string,
) => {
  // verify refresh token
  const refresh_token: FastifyJWT['payload'] = await app.jwt.verify(token);
  if (refresh_token.tokenType != 'refresh_token') throw new ACCESS_DENIED();

  // check if logged out or not
  const lastLogOut = await repo(UserLogout).findOne({
    where: { user: { id: refresh_token.id } },
    order: { createdAt: 'DESC' },
  });
  if (lastLogOut) {
    if (lastLogOut.createdAt.getTime() > refresh_token.time)
      // it means user logged out
      throw new ACCESS_DENIED();
  }

  // finding active user with that id
  const user = await repo(User).findOne({
    where: {
      id: refresh_token.id,
      isActive: true,
    },
    relations: ['role'],
  });
  if (!user) throw new ACCESS_DENIED();
  return user;
};

export const GetActiveUserByEmailAndPassword = async (
  email: string,
  password: string,
) => {
  // finding active user with that username
  const user = await repo(User).findOne({
    where: {
      email,
      isActive: true,
    },
    relations: ['role'],
  });

  // comparing password
  if (!user || !(await compare(password, user.password))) {
    throw new ACCESS_DENIED();
  }

  return user;
};

export const GenerateTokensForUser = async (
  app: FastifyInstance,
  user: User,
) => {
  // getting scope
  let scope: string;
  if (user.role.isRoot) {
    scope = Object.keys(permissions).join(' ');
  } else if (user.role.isActive) {
    const permissions = await repo(RolePermission).findBy({
      role: { id: user.role.id },
    });
    scope = permissions.map((p) => p.permission).join(' ');
  } else {
    scope = '';
  }

  // signing access_token
  const access_token = app.jwt.sign(
    {
      tokenType: 'access_token',
      id: user.id,
      scope,
      time: new Date().getTime(),
    },
    { expiresIn: TTL },
  );

  // signing refresh_token
  const refresh_token = app.jwt.sign(
    {
      tokenType: 'refresh_token',
      id: user.id,
      time: new Date().getTime(),
    },
    // { notBefore: TTL },
  );

  return {
    access_token,
    refresh_token,
    token_type: 'bearer',
    expires_in: TTL,
    scope,
  };
};
