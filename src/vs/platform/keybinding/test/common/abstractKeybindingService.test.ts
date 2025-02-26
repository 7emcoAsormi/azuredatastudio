/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as assert from 'assert';
import { KeyChord, KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { createKeybinding, createSimpleKeybinding, Keybinding, ResolvedKeybinding, SimpleKeybinding } from 'vs/base/common/keybindings';
import { Disposable } from 'vs/base/common/lifecycle';
import { OS } from 'vs/base/common/platform';
import Severity from 'vs/base/common/severity';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { ContextKeyExpr, ContextKeyExpression, IContext, IContextKeyService, IContextKeyServiceTarget } from 'vs/platform/contextkey/common/contextkey';
import { AbstractKeybindingService } from 'vs/platform/keybinding/common/abstractKeybindingService';
import { IKeyboardEvent } from 'vs/platform/keybinding/common/keybinding';
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver';
import { ResolvedKeybindingItem } from 'vs/platform/keybinding/common/resolvedKeybindingItem';
import { USLayoutResolvedKeybinding } from 'vs/platform/keybinding/common/usLayoutResolvedKeybinding';
import { NullLogService } from 'vs/platform/log/common/log';
import { INotification, INotificationService, IPromptChoice, IPromptOptions, IStatusMessageOptions, NoOpNotification } from 'vs/platform/notification/common/notification';
import { NullTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils';

function createContext(ctx: any) {
	return {
		getValue: (key: string) => {
			return ctx[key];
		}
	};
}

suite('AbstractKeybindingService', () => {

	class TestKeybindingService extends AbstractKeybindingService {
		private _resolver: KeybindingResolver;

		constructor(
			resolver: KeybindingResolver,
			contextKeyService: IContextKeyService,
			commandService: ICommandService,
			notificationService: INotificationService
		) {
			super(contextKeyService, commandService, NullTelemetryService, notificationService, new NullLogService());
			this._resolver = resolver;
		}

		protected _getResolver(): KeybindingResolver {
			return this._resolver;
		}

		protected _documentHasFocus(): boolean {
			return true;
		}

		public resolveKeybinding(kb: Keybinding): ResolvedKeybinding[] {
			return [new USLayoutResolvedKeybinding(kb, OS)];
		}

		public resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
			const keybinding = new SimpleKeybinding(
				keyboardEvent.ctrlKey,
				keyboardEvent.shiftKey,
				keyboardEvent.altKey,
				keyboardEvent.metaKey,
				keyboardEvent.keyCode
			).toChord();
			return this.resolveKeybinding(keybinding)[0];
		}

		public resolveUserBinding(userBinding: string): ResolvedKeybinding[] {
			return [];
		}

		public testDispatch(kb: number): boolean {
			const keybinding = createSimpleKeybinding(kb, OS);
			return this._dispatch({
				_standardKeyboardEventBrand: true,
				ctrlKey: keybinding.ctrlKey,
				shiftKey: keybinding.shiftKey,
				altKey: keybinding.altKey,
				metaKey: keybinding.metaKey,
				keyCode: keybinding.keyCode,
				code: null!
			}, null!);
		}

		public _dumpDebugInfo(): string {
			return '';
		}

		public _dumpDebugInfoJSON(): string {
			return '';
		}

		public registerSchemaContribution() {
			// noop
		}
	}

	let createTestKeybindingService: (items: ResolvedKeybindingItem[], contextValue?: any) => TestKeybindingService = null!;
	let currentContextValue: IContext | null = null;
	let executeCommandCalls: { commandId: string; args: any[] }[] = null!;
	let showMessageCalls: { sev: Severity; message: any }[] = null!;
	let statusMessageCalls: string[] | null = null;
	let statusMessageCallsDisposed: string[] | null = null;

	setup(() => {
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		createTestKeybindingService = (items: ResolvedKeybindingItem[]): TestKeybindingService => {

			const contextKeyService: IContextKeyService = {
				_serviceBrand: undefined,
				dispose: undefined!,
				onDidChangeContext: undefined!,
				bufferChangeEvents() { },
				createKey: undefined!,
				contextMatchesRules: undefined!,
				getContextKeyValue: undefined!,
				createScoped: undefined!,
				createOverlay: undefined!,
				getContext: (target: IContextKeyServiceTarget): any => {
					return currentContextValue;
				},
				updateParent: () => { }
			};

			const commandService: ICommandService = {
				_serviceBrand: undefined,
				onWillExecuteCommand: () => Disposable.None,
				onDidExecuteCommand: () => Disposable.None,
				executeCommand: (commandId: string, ...args: any[]): Promise<any> => {
					executeCommandCalls.push({
						commandId: commandId,
						args: args
					});
					return Promise.resolve(undefined);
				}
			};

			const notificationService: INotificationService = {
				_serviceBrand: undefined,
				doNotDisturbMode: false,
				onDidAddNotification: undefined!,
				onDidRemoveNotification: undefined!,
				onDidChangeDoNotDisturbMode: undefined!,
				notify: (notification: INotification) => {
					showMessageCalls.push({ sev: notification.severity, message: notification.message });
					return new NoOpNotification();
				},
				info: (message: any) => {
					showMessageCalls.push({ sev: Severity.Info, message });
					return new NoOpNotification();
				},
				warn: (message: any) => {
					showMessageCalls.push({ sev: Severity.Warning, message });
					return new NoOpNotification();
				},
				error: (message: any) => {
					showMessageCalls.push({ sev: Severity.Error, message });
					return new NoOpNotification();
				},
				prompt(severity: Severity, message: string, choices: IPromptChoice[], options?: IPromptOptions) {
					throw new Error('not implemented');
				},
				status(message: string, options?: IStatusMessageOptions) {
					statusMessageCalls!.push(message);
					return {
						dispose: () => {
							statusMessageCallsDisposed!.push(message);
						}
					};
				}
			};

			const resolver = new KeybindingResolver(items, [], () => { });

			return new TestKeybindingService(resolver, contextKeyService, commandService, notificationService);
		};
	});

	teardown(() => {
		currentContextValue = null;
		executeCommandCalls = null!;
		showMessageCalls = null!;
		createTestKeybindingService = null!;
		statusMessageCalls = null;
		statusMessageCallsDisposed = null;
	});

	function kbItem(keybinding: number, command: string, when?: ContextKeyExpression): ResolvedKeybindingItem {
		const resolvedKeybinding = (keybinding !== 0 ? new USLayoutResolvedKeybinding(createKeybinding(keybinding, OS)!, OS) : undefined);
		return new ResolvedKeybindingItem(
			resolvedKeybinding,
			command,
			null,
			when,
			true,
			null,
			false
		);
	}

	function toUsLabel(keybinding: number): string {
		const usResolvedKeybinding = new USLayoutResolvedKeybinding(createKeybinding(keybinding, OS)!, OS);
		return usResolvedKeybinding.getLabel()!;
	}

	test('issue #16498: chord mode is quit for invalid chords', () => {

		const kbService = createTestKeybindingService([
			kbItem(KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyX), 'chordCommand'),
			kbItem(KeyCode.Backspace, 'simpleCommand'),
		]);

		// send Ctrl/Cmd + K
		let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, []);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, [
			`(${toUsLabel(KeyMod.CtrlCmd | KeyCode.KeyK)}) was pressed. Waiting for second key of chord...`
		]);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send backspace
		shouldPreventDefault = kbService.testDispatch(KeyCode.Backspace);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, []);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, [
			`The key combination (${toUsLabel(KeyMod.CtrlCmd | KeyCode.KeyK)}, ${toUsLabel(KeyCode.Backspace)}) is not a command.`
		]);
		assert.deepStrictEqual(statusMessageCallsDisposed, [
			`(${toUsLabel(KeyMod.CtrlCmd | KeyCode.KeyK)}) was pressed. Waiting for second key of chord...`
		]);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send backspace
		shouldPreventDefault = kbService.testDispatch(KeyCode.Backspace);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'simpleCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		kbService.dispose();
	});

	test('issue #16833: Keybinding service should not testDispatch on modifier keys', () => {

		const kbService = createTestKeybindingService([
			kbItem(KeyCode.Ctrl, 'nope'),
			kbItem(KeyCode.Meta, 'nope'),
			kbItem(KeyCode.Alt, 'nope'),
			kbItem(KeyCode.Shift, 'nope'),

			kbItem(KeyMod.CtrlCmd, 'nope'),
			kbItem(KeyMod.WinCtrl, 'nope'),
			kbItem(KeyMod.Alt, 'nope'),
			kbItem(KeyMod.Shift, 'nope'),
		]);

		function assertIsIgnored(keybinding: number): void {
			const shouldPreventDefault = kbService.testDispatch(keybinding);
			assert.strictEqual(shouldPreventDefault, false);
			assert.deepStrictEqual(executeCommandCalls, []);
			assert.deepStrictEqual(showMessageCalls, []);
			assert.deepStrictEqual(statusMessageCalls, []);
			assert.deepStrictEqual(statusMessageCallsDisposed, []);
			executeCommandCalls = [];
			showMessageCalls = [];
			statusMessageCalls = [];
			statusMessageCallsDisposed = [];
		}

		assertIsIgnored(KeyCode.Ctrl);
		assertIsIgnored(KeyCode.Meta);
		assertIsIgnored(KeyCode.Alt);
		assertIsIgnored(KeyCode.Shift);

		assertIsIgnored(KeyMod.CtrlCmd);
		assertIsIgnored(KeyMod.WinCtrl);
		assertIsIgnored(KeyMod.Alt);
		assertIsIgnored(KeyMod.Shift);

		kbService.dispose();
	});

	test('can trigger command that is sharing keybinding with chord', () => {

		const kbService = createTestKeybindingService([
			kbItem(KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyX), 'chordCommand'),
			kbItem(KeyMod.CtrlCmd | KeyCode.KeyK, 'simpleCommand', ContextKeyExpr.has('key1')),
		]);


		// send Ctrl/Cmd + K
		currentContextValue = createContext({
			key1: true
		});
		let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'simpleCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send Ctrl/Cmd + K
		currentContextValue = createContext({});
		shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, []);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, [
			`(${toUsLabel(KeyMod.CtrlCmd | KeyCode.KeyK)}) was pressed. Waiting for second key of chord...`
		]);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send Ctrl/Cmd + X
		currentContextValue = createContext({});
		shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyX);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'chordCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, [
			`(${toUsLabel(KeyMod.CtrlCmd | KeyCode.KeyK)}) was pressed. Waiting for second key of chord...`
		]);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		kbService.dispose();
	});

	test('cannot trigger chord if command is overwriting', () => {

		const kbService = createTestKeybindingService([
			kbItem(KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyX), 'chordCommand', ContextKeyExpr.has('key1')),
			kbItem(KeyMod.CtrlCmd | KeyCode.KeyK, 'simpleCommand'),
		]);


		// send Ctrl/Cmd + K
		currentContextValue = createContext({});
		let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'simpleCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send Ctrl/Cmd + K
		currentContextValue = createContext({
			key1: true
		});
		shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, true);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'simpleCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		// send Ctrl/Cmd + X
		currentContextValue = createContext({
			key1: true
		});
		shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyX);
		assert.strictEqual(shouldPreventDefault, false);
		assert.deepStrictEqual(executeCommandCalls, []);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		kbService.dispose();
	});

	test('can have spying command', () => {

		const kbService = createTestKeybindingService([
			kbItem(KeyMod.CtrlCmd | KeyCode.KeyK, '^simpleCommand'),
		]);

		// send Ctrl/Cmd + K
		currentContextValue = createContext({});
		const shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | KeyCode.KeyK);
		assert.strictEqual(shouldPreventDefault, false);
		assert.deepStrictEqual(executeCommandCalls, [{
			commandId: 'simpleCommand',
			args: [null]
		}]);
		assert.deepStrictEqual(showMessageCalls, []);
		assert.deepStrictEqual(statusMessageCalls, []);
		assert.deepStrictEqual(statusMessageCallsDisposed, []);
		executeCommandCalls = [];
		showMessageCalls = [];
		statusMessageCalls = [];
		statusMessageCallsDisposed = [];

		kbService.dispose();
	});
});
