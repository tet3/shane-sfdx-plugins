/* tslint:disable:no-unused-expression */

import { expect, test } from '@salesforce/command/dist/test';
import fs = require('fs-extra');
import util = require('util');
import xml2js = require('xml2js');

import child_process = require('child_process');
import testutils = require('../../../helpers/testutils');

const exec = util.promisify(child_process.exec);
const testProjectName = 'testProject';

before(async () => {
  await exec(`rm -rf ${testProjectName}`);
  await exec(`sfdx force:project:create -n ${testProjectName}`);
});

describe('shane:static:create', () => {

  it('creates a static css', async () => {

    const name = 'NewStatic';

    await exec(`sfdx shane:static:create -n ${name} -y css`, { cwd: testProjectName });
    expect(fs.existsSync(`${testProjectName}/force-app/main/default/staticresources`)).to.be.true;
    expect(fs.existsSync(`${testProjectName}/force-app/main/default/staticresources/${name}.resource-meta.xml`)).to.be.true;
    expect(fs.existsSync(`${testProjectName}/force-app/main/default/staticresources/${name}.css`)).to.be.true;

    // const xml = await fs.readFile(`${testProjectName}/force-app/main/default/remoteSiteSettings/${testRemSite}.remoteSite-meta.xml`);

    const parsed = await testutils.getParsedXML(`${testProjectName}/force-app/main/default/staticresources/${name}.resource-meta.xml`);

    expect(parsed.StaticResource).to.be.an('object');
    expect(parsed.StaticResource.contentType).to.equal('text/css');
    expect(parsed.StaticResource.fullName).to.equal(name);
  });

  it('deploys as valid code', async () => {
    if (process.env.LOCALONLY === 'true') {
      console.log('skipping online-only test');
    } else {
      const deploySuccess = await testutils.itDeploys(testProjectName);
      expect(deploySuccess).to.be.true;
    }
  }).timeout(60000);

});

after(async () => {
  await exec(`rm -rf ${testProjectName}`);
});
