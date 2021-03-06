import { flags } from '@oclif/command';
import { join } from 'path';
import { SfdxCommand, core } from '@salesforce/command';
import fs = require('fs-extra');
import request = require('request-promise-native');
// import localFile2CV = require('../../../shared/localFile2CV');
import userIdLookup = require('../../../../shared/userIdLookup');

import chalk from 'chalk';

export default class Set extends SfdxCommand {

  public static description = 'Set the password for a user by first/last name';

  public static examples = [
`sfdx shane:user:password:set -p sfdx1234 -g User -l User
// sets the password for User User to sfdx1234
`
  ];

  protected static flagsConfig = {
    firstName: flags.string({ char: 'g', required: true, description: 'first (given) name of the user--keeping -f for file for consistency' }),
    lastName: flags.string({ char: 'l', required: true, description: 'last name of the user' }),
    password: flags.string({ char: 'p', required: true, description: 'local path of the photo to use' })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const conn = this.org.getConnection();
    let user;

    try {
      user = await userIdLookup.getUserId(conn, this.flags.lastName, this.flags.firstName);
    } catch (e) {
      this.ux.error(chalk.red(e));
      return {
        status: 1,
        result: {
          error: e
        }
      };
    }

    this.ux.log(`found user with id ${user.Id}`);

    const resetResult = await request({
      method: 'post',
      uri: `${conn.instanceUrl}/services/data/v41.0/sobjects/User/${user.Id}/password`,
      body: {
        NewPassword: this.flags.password
      },
      headers: {
        Authorization: `Bearer ${conn.accessToken}`
      },
      json: true,
      resolveWithFullResponse: true
    });

    if (resetResult.statusCode === 204) {
      this.ux.log(chalk.green(`Successfully set the password "${this.flags.password}" for user ${user.Username}.`));
      this.ux.log(`You can see the password again by running "sfdx force:user:display -u ${user.Username}".`);
      return {
        password: this.flags.password
      };
    } else {
      this.ux.error(chalk.red('Password not set correctly.'));
      return {
        status: 1,
        result: resetResult
      };
    }

  }

}
