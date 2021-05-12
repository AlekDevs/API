import { UserTypes } from '../../../data/types/entity-types';
import Deps from '../../../utils/deps';
import { Email } from './email';
import { Verification } from './verification';

export class EmailFunctions {
  constructor(
    private email = Deps.get<Email>(Email),
    private verification = Deps.get<Verification>(Verification),
  ) {}
  
  public async verifyCode(user: UserTypes.Self) {
    const expiresIn = 5 * 60 * 1000;
    await this.email.send('verify', {
      expiresIn,
      user,
      code: this.verification.create(user.email, 'LOGIN', expiresIn),
    }, user.email as string);
  }
  public async verifyEmail(emailAddress: string, user: UserTypes.Self) {
    const expiresIn = 24 * 60 * 60 * 1000;
    await this.email.send('verify-email', {
      expiresIn,
      user,
      code: this.verification.create(emailAddress, 'VERIFY_EMAIL'),
    }, emailAddress);
  }
  public async forgotPassword(emailAddress: string, user: UserTypes.Self) {
    const expiresIn = 1 * 60 * 60 * 1000;
    await this.email.send('forgot-password', {
      expiresIn,
      user,
      code: this.verification.create(emailAddress, 'FORGOT_PASSWORD'),
    }, emailAddress);
  }
}