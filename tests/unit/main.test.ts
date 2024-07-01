/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { mock, test } from 'node:test';
import assert from 'node:assert';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as setupGcloud from '@google-github-actions/setup-cloud-sdk';
import { TestToolCache } from '@google-github-actions/setup-cloud-sdk';

import { assertMembers } from '@google-github-actions/actions-utils';

import { run } from '../../src/main';

const fakeInputs: { [key: string]: string } = {
  image: 'gcr.io/cloudrun/hello',
  project_id: 'test',
};

const defaultMocks = (
  m: typeof mock,
  overrideInputs?: Record<string, string>,
): Record<string, any> => {
  const inputs = Object.assign({}, fakeInputs, overrideInputs);
  return {
    setFailed: m.method(core, 'setFailed', (msg: string) => {
      throw new Error(msg);
    }),
    getBooleanInput: m.method(core, 'getBooleanInput', (name: string) => {
      return !!inputs[name];
    }),
    getMultilineInput: m.method(core, 'getMultilineInput', (name: string) => {
      return inputs[name];
    }),
    getInput: m.method(core, 'getInput', (name: string) => {
      return inputs[name];
    }),
    getExecOutput: m.method(exec, 'getExecOutput', () => {
      return { exitCode: 0, stderr: '', stdout: '{}' };
    }),

    authenticateGcloudSDK: m.method(setupGcloud, 'authenticateGcloudSDK', () => {}),
    isAuthenticated: m.method(setupGcloud, 'isAuthenticated', () => {}),
    isInstalled: m.method(setupGcloud, 'isInstalled', () => {
      return true;
    }),
    installGcloudSDK: m.method(setupGcloud, 'installGcloudSDK', async () => {
      return '1.2.3';
    }),
    installComponent: m.method(setupGcloud, 'installComponent', () => {}),
    setProject: m.method(setupGcloud, 'setProject', () => {}),
    getLatestGcloudSDKVersion: m.method(setupGcloud, 'getLatestGcloudSDKVersion', () => {
      return '1.2.3';
    }),
  };
};

test('#run', { concurrency: true }, async (suite) => {
  const originalEnv = Object.assign({}, process.env);

  suite.before(() => {
    suite.mock.method(core, 'debug', () => {});
    suite.mock.method(core, 'info', () => {});
    suite.mock.method(core, 'warning', () => {});
    suite.mock.method(core, 'setOutput', () => {});
    suite.mock.method(core, 'setSecret', () => {});
    suite.mock.method(core, 'group', () => {});
    suite.mock.method(core, 'startGroup', () => {});
    suite.mock.method(core, 'endGroup', () => {});
    suite.mock.method(core, 'addPath', () => {});
    suite.mock.method(core, 'exportVariable', () => {});
  });

  suite.beforeEach(async () => {
    await TestToolCache.start();
  });

  suite.afterEach(async () => {
    process.env = originalEnv;
    await TestToolCache.stop();
  });

  await suite.test('sets the load balancer name', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'path',
    });
    await run();

    const args = mocks.getExecOutput.mock.calls?.at(0).arguments?.at(1);
    assertMembers(args, ['load_balancer_name_input']);
  });

  await suite.test('sets a generic invalidate path', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
    });
    await run();

    const args = mocks.getExecOutput.mock.calls?.at(0).arguments?.at(1);
    assertMembers(args, ['--path', 'invalid_path']);
  });

  await suite.test('sets host if given', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
      host: 'host_name',
    });
    await run();

    const args = mocks.getExecOutput.mock.calls?.at(0).arguments?.at(1);
    assertMembers(args, ['--host', 'host_name']);
  });

  await suite.test('installs the gcloud SDK if it is not already installed', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
    });
    t.mock.method(setupGcloud, 'isInstalled', () => {
      return false;
    });

    await run();

    assert.deepStrictEqual(mocks.installGcloudSDK.mock.callCount(), 1);
  });

  await suite.test('uses the cached gcloud SDK if it was already installed', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
    });
    t.mock.method(setupGcloud, 'isInstalled', () => {
      return true;
    });

    await run();

    assert.deepStrictEqual(mocks.installGcloudSDK.mock.callCount(), 0);
  });

  await suite.test('uses default components without gcloud_component flag', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
    });

    await run();

    assert.deepStrictEqual(mocks.installComponent.mock.callCount(), 0);
  });

  await suite.test('throws error with invalid gcloud component flag', async (t) => {
    defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
      gcloud_component: 'wrong_value',
    });

    await assert.rejects(
      async () => {
        await run();
      },
      { message: /invalid input received for gcloud_component: wrong_value/ },
    );
  });

  await suite.test('installs alpha component with alpha flag', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
      gcloud_component: 'alpha',
    });

    await run();

    const args = mocks.installComponent.mock.calls?.at(0).arguments?.at(0);
    assert.deepStrictEqual(args, 'alpha');
  });

  await suite.test('installs alpha component with beta flag', async (t) => {
    const mocks = defaultMocks(t.mock, {
      load_balancer_name: 'load_balancer_name_input',
      path: 'invalid_path',
      gcloud_component: 'beta',
    });

    await run();

    const args = mocks.installComponent.mock.calls?.at(0).arguments?.at(0);
    assert.deepStrictEqual(args, 'beta');
  });
});
