"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("@azure/identity");
const cosmos_1 = require("@azure/cosmos");
const retry_1 = require("./retry");
if (process.argv.length !== 3) {
    console.error('Usage: node createBuild.js VERSION');
    process.exit(-1);
}
function getEnv(name) {
    const result = process.env[name];
    if (typeof result === 'undefined') {
        throw new Error('Missing env: ' + name);
    }
    return result;
}
async function main() {
    const [, , _version] = process.argv;
    const quality = getEnv('VSCODE_QUALITY');
    const commit = process.env['VSCODE_DISTRO_COMMIT']?.trim() || getEnv('BUILD_SOURCEVERSION');
    const queuedBy = getEnv('BUILD_QUEUEDBY');
    const sourceBranch = process.env['VSCODE_DISTRO_REF']?.trim() || getEnv('BUILD_SOURCEBRANCH');
    const version = _version + (quality === 'stable' ? '' : `-${quality}`);
    console.log('Creating build...');
    console.log('Quality:', quality);
    console.log('Version:', version);
    console.log('Commit:', commit);
    const build = {
        id: commit,
        timestamp: (new Date()).getTime(),
        version,
        isReleased: false,
        private: Boolean(process.env['VSCODE_DISTRO_REF']?.trim()),
        sourceBranch,
        queuedBy,
        assets: [],
        updates: {}
    };
    const aadCredentials = new identity_1.ClientSecretCredential(process.env['AZURE_TENANT_ID'], process.env['AZURE_CLIENT_ID'], process.env['AZURE_CLIENT_SECRET']);
    const client = new cosmos_1.CosmosClient({ endpoint: process.env['AZURE_DOCUMENTDB_ENDPOINT'], aadCredentials });
    const scripts = client.database('builds').container(quality).scripts;
    await (0, retry_1.retry)(() => scripts.storedProcedure('createBuild').execute('', [{ ...build, _partitionKey: '' }]));
}
main().then(() => {
    console.log('Build successfully created');
    process.exit(0);
}, err => {
    console.error(err);
    process.exit(1);
});
