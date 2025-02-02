import { Command, Notice, Plugin } from 'obsidian';
import { AppExtension } from "./uncover-obsidian";
import { CommandAliasPluginSettingTab } from "./setting-tab";
import { CommandSuggestionModal } from "./add-alias-modal";
interface CommandAliasPluginSettings {
	aliases: AliasMap;
}

type AliasMap = {
	[key: string]: Alias;
}
interface Alias {
	name: string;
	commandId: string;
}

const DEFAULT_SETTINGS: CommandAliasPluginSettings = {
	aliases: {}
}

export default class CommandAliasPlugin extends Plugin {
	settings: CommandAliasPluginSettings;

	async onload() {
		console.log('loading plugin');

		let app = this.app as AppExtension;

		await this.loadSettings();

		this.addCommand({
			id: "add-alias",
			name: "Add command alias",
			callback: () => {
				let modal = new CommandSuggestionModal(this.app, this);
				modal.open();
			},
		});

		for (const aliasId in this.settings.aliases) {
			if (!Object.prototype.hasOwnProperty.call(this.settings.aliases, aliasId)) {
				continue;
			}
			this.addAliasCommand(aliasId);
		}

		this.addSettingTab(new CommandAliasPluginSettingTab(this.app, this));
	}

	private addAliasCommand(aliasId: string) {
		let app = this.app as AppExtension;

		const alias = this.settings.aliases[aliasId];
		const target = app.commands.commands[alias.commandId];
		if (target) {
			let command: Command = {
				id: `alias:${aliasId}`,
				name: `${alias.name}: ${target.name}`,
			};
			if (target.callback) {
				command.callback = () => {
					const target = app.commands.commands[alias.commandId];
					if (target) {
						target.callback();
					} else {
						new Notice("Missing command. The command may be invalid.");
					}
				};
			}
			if (target.checkCallback) {
				command.checkCallback = (checking) => {
					const target = app.commands.commands[alias.commandId];
					if (target) {
						return target.checkCallback(checking);
					}
					if (checking) {
						// Don't hide the probrem.
						return true;
					} else {
						new Notice("Missing command. The command may be invalid.");
					}
				}
			}
			this.addCommand(command);
		} else {
			// fallback
			let command: Command = {
				id: `alias:${aliasId}`,
				name: `${alias.name}: Missing command. Run this and try rebinding.`,
				callback: () => {
					this.unload();
					this.load();
				}
			}
			this.addCommand(command);
		}
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	addAliasSetting(aliasName: string, commandId: string) {
		let aliasId = Date.now().toString();
		console.log('Add id:', aliasId, 'alias:', aliasName, "command:", commandId);
		this.settings.aliases[aliasId] = {
			name: aliasName,
			commandId: commandId,
		}
	}
}
