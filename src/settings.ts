import { App, PluginSettingTab, Setting, Platform } from "obsidian";
import FullscreenPlugin from "./main";

/* ===================== interfaces ===================== */

export interface FullscreenPluginSettings {
	hideRibbon: boolean;
	hideTabHeaders: boolean;
	hideSidebars: boolean;
	hideStatusBar: boolean;
	hideCanvasControls: boolean;
	consecutiveClickTimes: number;
	f11Fullscreen: boolean;
	revealOnHover: boolean;
	focusMode: boolean;
	typewriterScroll: boolean;
	smoothTransitions: boolean;
	rememberFullscreen: boolean;
	wasFullscreen: boolean;
}

export const DEFAULT_SETTINGS: FullscreenPluginSettings = {
	hideRibbon: true,
	hideTabHeaders: true,
	hideSidebars: true,
	hideStatusBar: true, /* in canvas */
	hideCanvasControls: true,
	consecutiveClickTimes: 3,
	f11Fullscreen: false,
	revealOnHover: false,
	focusMode: false,
	typewriterScroll: false,
	smoothTransitions: true,
	rememberFullscreen: false,
	wasFullscreen: false,
}

/* ===================== settings tab ===================== */

export class FullscreenSettingTab extends PluginSettingTab {
	plugin: FullscreenPlugin;

	constructor(app: App, plugin: FullscreenPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		/* ===================== plugin info ===================== */

		new Setting(containerEl)
			.setName('Obsidian fullscreen')
			.setDesc('A lightweight, CSS-driven fullscreen experience. Hides UI chrome and lets you focus on your content.');

		/* ===================== animations ===================== */

		new Setting(containerEl)
			.setHeading()
			.setName('Animations');

		new Setting(containerEl)
			.setName('Smooth transitions')
			.setDesc('Enable smooth animations when entering or exiting fullscreen mode.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.smoothTransitions)
				.onChange(async (value) => {
					this.plugin.settings.smoothTransitions = value;
					await this.plugin.saveSettings();
				}));

		/* ===================== visibility ===================== */

		new Setting(containerEl)
			.setHeading()
			.setName('Visibility');

		new Setting(containerEl)
			.setName('Hide ribbon')
			.setDesc('Hides the left ribbon on desktop and the mobile bottom navigation bar.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideRibbon)
				.onChange(async (value) => {
					this.plugin.settings.hideRibbon = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hide tab bar')
			.setDesc('Hides the workspace tab header container.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideTabHeaders)
				.onChange(async (value) => {
					this.plugin.settings.hideTabHeaders = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hide sidebars')
			.setDesc('Collapses and completely hides both the left and right sidebars.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideSidebars)
				.onChange(async (value) => {
					this.plugin.settings.hideSidebars = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hide status bar')
			.setDesc('Hides the small status bar at the bottom of the screen.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.hideStatusBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hide canvas controls')
			.setDesc('Hides floating canvas interface controls overlay.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideCanvasControls)
				.onChange(async (value) => {
					this.plugin.settings.hideCanvasControls = value;
					await this.plugin.saveSettings();
				}));

		/* ===================== behavior ===================== */

		new Setting(containerEl)
			.setHeading()
			.setName('Behavior');

		new Setting(containerEl)
			.setName('Toggle via consecutive clicks')
			.setDesc('Number of quick clicks/taps to toggle fullscreen. Most useful on mobile where the command palette is harder to reach.')
			.addDropdown(component => {
				component
					.addOption('2', 'Double click')
					.addOption('3', 'Triple click')
					.addOption('-1', 'Disabled')
					.setValue(this.plugin.settings.consecutiveClickTimes.toString())
					.onChange(async (value) => {
						this.plugin.settings.consecutiveClickTimes = parseInt(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Persist fullscreen state')
			.setDesc('Re-enters fullscreen automatically on next launch if it was active when Obsidian was closed.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.rememberFullscreen)
				.onChange(async (value) => {
					this.plugin.settings.rememberFullscreen = value;
					await this.plugin.saveSettings();
				}));

		/* ===================== experimental ===================== */

		const experimentalHeading = new Setting(containerEl)
			.setHeading()
			.setName('Experimental (click to expand)');
		experimentalHeading.settingEl.addClass('fullscreen-experimental-heading');

		const experimentalEl = containerEl.createDiv();
		experimentalEl.addClass('fullscreen-experimental-container', 'is-hidden');

		experimentalHeading.settingEl.addEventListener('click', () => {
			const isHidden = experimentalEl.classList.contains('is-hidden');
			if (isHidden) {
				experimentalEl.removeClass('is-hidden');
				experimentalHeading.setName('Experimental (click to collapse)');
			} else {
				experimentalEl.addClass('is-hidden');
				experimentalHeading.setName('Experimental (click to expand)');
			}
		});

		if (!Platform.isMobile) {
			new Setting(experimentalEl)
				.setName('F11 fullscreen')
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				.setDesc('Covers the OS taskbar via F11 when fullscreen activates.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.f11Fullscreen)
					.onChange(async (value) => {
						this.plugin.settings.f11Fullscreen = value;
						await this.plugin.saveSettings();
					}));

			new Setting(experimentalEl)
				.setName('Reveal on hover')
				.setDesc('Hovering near a screen edge slides the hidden panel back into view.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.revealOnHover)
					.onChange(async (value) => {
						this.plugin.settings.revealOnHover = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(experimentalEl)
			.setName('Focus mode')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('Draws visual focus to the currently active text line while dimming the rest of the editor content.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.focusMode)
				.onChange(async (value) => {
					this.plugin.settings.focusMode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(experimentalEl)
			.setName('Typewriter scrolling')
			.setDesc('Adds vertical padding layout to maintain the active typing line roughly centered.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.typewriterScroll)
				.onChange(async (value) => {
					this.plugin.settings.typewriterScroll = value;
					await this.plugin.saveSettings();
				}));
	}
}
