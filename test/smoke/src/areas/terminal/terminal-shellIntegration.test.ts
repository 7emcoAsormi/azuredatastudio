/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Application, Terminal, SettingsEditor, TerminalCommandIdWithValue, TerminalCommandId } from '../../../../automation';
import { setTerminalTestSettings } from './terminal-helpers';

export function setup() {
	describe('Terminal Shell Integration', () => {
		let terminal: Terminal;
		let settingsEditor: SettingsEditor;
		let app: Application;
		// Acquire automation API
		before(async function () {
			app = this.app as Application;
			terminal = app.workbench.terminal;
			settingsEditor = app.workbench.settingsEditor;
		});

		afterEach(async function () {
			await app.workbench.terminal.runCommand(TerminalCommandId.KillAll);
		});

		async function createShellIntegrationProfile() {
			await terminal.runCommandWithValue(TerminalCommandIdWithValue.NewWithProfile, process.platform === 'win32' ? 'PowerShell' : 'bash');
		}

		// TODO: Some agents may not have pwsh installed?
		(process.platform === 'win32' ? describe.skip : describe)(`Process-based tests`, function () {
			before(async function () {
				await setTerminalTestSettings(app, [['terminal.integrated.shellIntegration.enabled', 'true']]);
			});
			after(async function () {
				await settingsEditor.clearUserSettings();
			});
			describe('Decorations', function () {
				describe('Should show default icons', function () {
					it('Placeholder', async () => {
						await createShellIntegrationProfile();
						await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 0 });
					});
					it('Success', async () => {
						await createShellIntegrationProfile();
						await terminal.runCommandInTerminal(`echo "success"`);
						await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 0 });
					});
					it('Error', async () => {
						await createShellIntegrationProfile();
						await terminal.runCommandInTerminal(`false`);
						await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 1 });
					});
				});
				describe('Custom configuration', function () {
					it('Should update and show custom icons', async () => {
						await createShellIntegrationProfile();
						await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 0 });
						await terminal.runCommandInTerminal(`echo "foo"`);
						await terminal.runCommandInTerminal(`bar`);
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationIcon', '"zap"');
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationIconSuccess', '"zap"');
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationIconError', '"zap"');
						await terminal.assertCommandDecorations(undefined, { updatedIcon: "zap", count: 3 });
					});
				});
				describe('terminal.integrated.shellIntegration.decorationsEnabled should determine gutter and overview ruler decoration visibility', function () {
					beforeEach(async () => {
						await settingsEditor.clearUserSettings();
						await setTerminalTestSettings(app, [['terminal.integrated.shellIntegration.enabled', 'true']]);
						await createShellIntegrationProfile();
						await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 0 });
						await terminal.runCommandInTerminal(`echo "foo"`);
						await terminal.runCommandInTerminal(`bar`);
						await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 });
					});
					afterEach(async () => {
						await app.workbench.terminal.runCommand(TerminalCommandId.KillAll);
					});
					it('never', async () => {
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationsEnabled', '"never"');
						await terminal.assertCommandDecorations({ placeholder: 0, success: 0, error: 0 }, undefined, 'never');
					});
					it('both', async () => {
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationsEnabled', '"both"');
						await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 }, undefined, 'both');
					});
					it('gutter', async () => {
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationsEnabled', '"gutter"');
						await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 }, undefined, 'gutter');
					});
					it('overviewRuler', async () => {
						await settingsEditor.addUserSetting('terminal.integrated.shellIntegration.decorationsEnabled', '"overviewRuler"');
						await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 }, undefined, 'overviewRuler');
					});
				});
			});
		});

		// These are integration tests that only test the UI side by simulating process writes.
		// Because of this, they do not test the shell integration scripts, only what the scripts
		// are expected to write.
		describe('Write data-based tests', () => {
			before(async function () {
				await setTerminalTestSettings(app);
			});
			after(async function () {
				await settingsEditor.clearUserSettings();
			});
			beforeEach(async function () {
				// Create the simplest system profile to get as little process interaction as possible
				await terminal.createTerminal();
				// Erase all content and reset cursor to top
				await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${csi('2J')}${csi('H')}`);
			});
			describe('VS Code sequences', () => {
				it('should handle the simple case', async () => {
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${vsc('A')}Prompt> ${vsc('B')}exitcode 0`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `\\r\\n${vsc('C')}Success\\r\\n${vsc('D;0')}`);
					await terminal.assertCommandDecorations({ placeholder: 0, success: 1, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${vsc('A')}Prompt> ${vsc('B')}exitcode 1`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `\\r\\n${vsc('C')}Failure\\r\\n${vsc('D;1')}`);
					await terminal.assertCommandDecorations({ placeholder: 0, success: 1, error: 1 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${vsc('A')}Prompt> ${vsc('B')}`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 });
				});
			});
			// TODO: This depends on https://github.com/microsoft/vscode/issues/146587
			describe.skip('Final Term sequences', () => {
				it('should handle the simple case', async () => {
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${ft('A')}Prompt> ${ft('B')}exitcode 0`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 0, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `\\r\\n${ft('C')}Success\\r\\n${ft('D;0')}`);
					await terminal.assertCommandDecorations({ placeholder: 0, success: 1, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${ft('A')}Prompt> ${ft('B')}exitcode 1`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 0 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `\\r\\n${ft('C')}Failure\\r\\n${ft('D;1')}`);
					await terminal.assertCommandDecorations({ placeholder: 0, success: 1, error: 1 });
					await terminal.runCommandWithValue(TerminalCommandIdWithValue.WriteDataToTerminal, `${ft('A')}Prompt> ${ft('B')}exitcode 1`);
					await terminal.assertCommandDecorations({ placeholder: 1, success: 1, error: 1 });
				});
			});
		});
	});
}

function ft(data: string) {
	return setTextParams(`133;${data}`);
}

function vsc(data: string) {
	return setTextParams(`633;${data}`);
}

function setTextParams(data: string) {
	return osc(`${data}\\x07`);
}

function osc(data: string) {
	return `\\x1b]${data}`;
}

function csi(data: string) {
	return `\\x1b[${data}`;
}
