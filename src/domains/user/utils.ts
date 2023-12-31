import { User } from '$src/domains/user/models/User';
import permissions from '$src/permissions';
import { repo } from '$src/infra/utils/repo';
import { RolePermission } from '$src/domains/user/models/RolePermission';
import assert from 'assert';
import { compare } from 'bcrypt';
import { RefreshToken } from '$src/domains/user/models/RefreshToken';
import { FastifyInstance } from 'fastify';
import { FastifyJWT } from '@fastify/jwt';
import {
  AccessTokenPayload,
  JwtPayload,
  RefreshTokenPayload,
} from '$src/infra/authorization';
const { TOKEN_TTL_SECONDS } = process.env;

if (TOKEN_TTL_SECONDS) {
  assert(Number(TOKEN_TTL_SECONDS) > 0, 'Invalid TOKEN_TTL_SECONDS');
}

const TTL = TOKEN_TTL_SECONDS ? Number(TOKEN_TTL_SECONDS) : 10 * 60; // 10 mins

export const getLoginAndActiveUserByRefreshToken = async (
  app: FastifyInstance,
  token: string,
): Promise<User | void> => {
  // verify refresh token
  const refresh_token = app.jwt.verify(token) as JwtPayload;
  if (refresh_token.type != 'refresh_token') return;

  // check refresh token valid or not
  const refreshTokenFromDatabase = await repo(RefreshToken).findOne({
    where: { id: refresh_token.jti },
    relations: { user: { role: true } },
  });
  if (!refreshTokenFromDatabase || !refreshTokenFromDatabase.valid) {
    return;
  }

  if (refreshTokenFromDatabase.user && refreshTokenFromDatabase.user.isActive)
    return refreshTokenFromDatabase.user;
};

export const getActiveUserByEmailAndPassword = async (
  email: string,
  password: string,
): Promise<User | void> => {
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
    return;
  }

  return user;
};

export const generateTokensForUser = async (
  app: FastifyInstance,
  user: User,
  refresh_token?: string,
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
      type: 'access_token',
      id: user.id,
      scope,
    },
    { expiresIn: TTL },
  );

  // signing refresh_token
  refresh_token ??= app.jwt.sign(
    {
      type: 'refresh_token',
      id: user.id,
      jti: (await repo(RefreshToken).save({ user })).id,
    },
    {},
    // { notBefore: TTL },
  );

  return {
    access_token,
    refresh_token,
    type: 'bearer' as const,
    expires_in: TTL,
    scope,
  };
};
