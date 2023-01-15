import * as jwt from 'jsonwebtoken';
import { configs } from '../configs';
/**
 * Payload expected by JWT's sign token function.
 *
 * @interface IJWTPayload
 */
export interface IJWTPayload {
  email: string;
  _id: string;
  roles: [string];
  permissions: [string];
  accountType: string;
  iat: number;
}

export interface IJWTToken {
  sign: (options: IJWTPayload) => string;
  verify: (token: string) => IJWTPayload;
}

/**
 * JWT tokens signing, verification and decoding utility.
 *
 * @export
 * @class Token
 */
export const JWTToken = {
  /**
   * Use JWT to sign a token
   */
  sign: (options: IJWTPayload) => {
    const {
      email,
      _id,
      roles,
      permissions,
      accountType,
    }: IJWTPayload = options;
    if (!email || !_id || !roles || !permissions || !accountType) {
      throw new Error('Expects email, id,roles and permissions in payload.');
    }

    return jwt.sign(
      { email, _id, roles, permissions, accountType },
      configs.jwtsecret,
      {
        expiresIn: '7d',
      },
    );
  },
  /**
   * Verify token, and get passed in variables
   */
  verify: (token: string) => {
    try {
      return jwt.verify(token, configs.jwtsecret) as IJWTPayload;
    } catch (error) {
      return {
        email: null,
        account: null,
        id: null,
        roles: [],
        permissions: [],
        accountType: '',
      };
    }
  },
};
