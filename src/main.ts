import { Plugin, Platform } from 'obsidian';
import { DEFAULT_SETTINGS, FullscreenPluginSettings, FullscreenSettingTab } from "./settings";

/* ===================== main plugin class ===================== */

export default class FullscreenPlugin extends Plugin {
	settings: FullscreenPluginSettings;
	isFullscreen: boolean = false;
	handleClickFunc: (evt: Event) => void;

	async onload() {
		await this.loadSettings();

		/* ===================== commands ===================== */

		this.addCommand({
			id: 'toggle-fullscreen',
			name: 'Toggle fullscreen',
			callback: () => {
				this.toggleFullscreen();
			}
		});

		/* ===================== settings tab ===================== */

		/* this adds a settings tab so the user can configure various aspects of the plugin */
		this.addSettingTab(new FullscreenSettingTab(this.app, this));

		/* ===================== initialization ===================== */

		this.updateBodyAttributes();
		this.addTouchEventListener();

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.rememberFullscreen && this.settings.wasFullscreen) {
				if (!this.isFullscreen) {
					this.toggleFullscreen();
				}
			}
		});
	}

	/* ===================== core methods ===================== */

	toggleFullscreen() {
		this.isFullscreen = !this.isFullscreen;
		const body = document.body;
		if (this.isFullscreen) {
			body.classList.add('fullscreen-plugin-active');
			if (!Platform.isMobile && this.settings.f11Fullscreen) {
				document.documentElement.requestFullscreen().catch(() => { });
			}
		} else {
			body.classList.remove('fullscreen-plugin-active');
			if (!Platform.isMobile && this.settings.f11Fullscreen && document.fullscreenElement) {
				document.exitFullscreen().catch(() => { });
			}
		}
		this.settings.wasFullscreen = this.isFullscreen;
		void this.saveData(this.settings);
	}

	updateBodyAttributes() {
		const body = document.body;
		body.setAttribute('data-fullscreen-hide-ribbon', this.settings.hideRibbon.toString());
		body.setAttribute('data-fullscreen-hide-tabs', this.settings.hideTabHeaders.toString());
		body.setAttribute('data-fullscreen-hide-sidebar', this.settings.hideSidebars.toString());
		body.setAttribute('data-fullscreen-hide-status', this.settings.hideStatusBar.toString());
		body.setAttribute('data-fullscreen-hide-canvas-controls', this.settings.hideCanvasControls.toString());
		if (!Platform.isMobile) {
			body.setAttribute('data-fullscreen-reveal-hover', this.settings.revealOnHover.toString());
		} else {
			body.removeAttribute('data-fullscreen-reveal-hover');
		}
		body.setAttribute('data-fullscreen-focus-mode', this.settings.focusMode.toString());
		body.setAttribute('data-fullscreen-typewriter', this.settings.typewriterScroll.toString());
		body.setAttribute('data-fullscreen-transitions', this.settings.smoothTransitions.toString());
	}

	addTouchEventListener() {
		const clickEventName = Platform.isMobile ? 'touchend' : 'click';
		if (this.handleClickFunc) {
			document.removeEventListener(clickEventName, this.handleClickFunc);
		}
		const waitTime = 300;
		const maxCount = this.settings.consecutiveClickTimes;

		if (maxCount === -1) {
			return; /* disabled */
		}

		let lastTouchEnd = 0;
		let touchCount = 0;
		this.handleClickFunc = (evt: Event) => {
			const target = evt.target as Element;
			if (target?.closest('.modal, .modal-container')) {
				return;
			}

			const now = (new Date()).getTime();
			touchCount = (now - lastTouchEnd) < waitTime ? touchCount + 1 : 1;
			lastTouchEnd = now;
			if (touchCount === maxCount) {
				/* evt.preventDefault(); 
				   evt.stopPropagation(); */
				this.toggleFullscreen();
				touchCount = 0; /* reset */
			}
		}

		/* use capture phase to intercept the click before obsidian's canvas can handle it */
		document.addEventListener(clickEventName, this.handleClickFunc);

		/* if double click is used, we must also intercept the native dblclick event */
		if (!Platform.isMobile) {
			this.registerDomEvent(document, 'dblclick', (evt: MouseEvent) => {
				if (this.settings.consecutiveClickTimes === 2) {
					/* evt.preventDefault();
					   evt.stopPropagation(); */
				}
			});
		}
	}

	/* ===================== cleanup ===================== */

	onunload() {
		const body = document.body;
		body.classList.remove('fullscreen-plugin-active');
		body.removeAttribute('data-fullscreen-hide-ribbon');
		body.removeAttribute('data-fullscreen-hide-tabs');
		body.removeAttribute('data-fullscreen-hide-sidebar');
		body.removeAttribute('data-fullscreen-hide-status');
		body.removeAttribute('data-fullscreen-hide-canvas-controls');
		body.removeAttribute('data-fullscreen-reveal-hover');
		body.removeAttribute('data-fullscreen-focus-mode');
		body.removeAttribute('data-fullscreen-typewriter');
		body.removeAttribute('data-fullscreen-transitions');

		if (this.handleClickFunc) {
			const clickEventName = Platform.isMobile ? 'touchend' : 'click';
			document.removeEventListener(clickEventName, this.handleClickFunc);
		}
	}

	/* ===================== settings management ===================== */

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FullscreenPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateBodyAttributes();
		this.addTouchEventListener();
	}
}
