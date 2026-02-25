import { Plugin, Platform, WorkspaceWindow } from 'obsidian';
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

		this.addSettingTab(new FullscreenSettingTab(this.app, this));

		/* ===================== initialization ===================== */

		/* apply settings attributes immediately so styles take effect */
		this.updateBodyAttributes();
		this.addTouchEventListener();

		this.app.workspace.onLayoutReady(() => {
			/* remember fullscreen state */
			if (this.settings.rememberFullscreen && this.settings.wasFullscreen) {
				if (!this.isFullscreen) {
					this.toggleFullscreen();
				}
			}
		});

		/* pop-out window support: apply settings when a new window opens */
		// @ts-ignore: undocumented event
		this.registerEvent(this.app.workspace.on('window-open', (win: WorkspaceWindow) => {
			this.updateBodyAttributes(win.win.document.body);
		}));
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

	/**
	 * Apply all settings as data-attributes to a body element.
	 * Defaults to the main document.body.
	 * Pass a different body (e.g. pop-out window) to apply to that window too.
	 */
	updateBodyAttributes(body: HTMLElement = document.body) {
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
		/* mobile */
		body.setAttribute('data-fullscreen-hide-mobile-top', this.settings.hideMobileViewTopSpacing.toString());
		/* visibility extras */
		body.setAttribute('data-fullscreen-hide-inline-title', this.settings.hideInlineTitle.toString());
		body.setAttribute('data-fullscreen-hide-view-actions', this.settings.hideViewActions.toString());
		body.setAttribute('data-fullscreen-hide-scrollbars', this.settings.hideScrollbars.toString());
		/* advanced focus */
		body.setAttribute('data-fullscreen-spotlight', this.settings.spotlightMode.toString());
		/* content width — set CSS custom property so the stylesheet can use it */
		const cw = this.settings.contentWidth;
		body.setAttribute('data-fullscreen-content-width', cw.toString());
		if (cw > 0) {
			body.style.setProperty('--fullscreen-content-width', `${cw}px`);
		} else {
			body.style.removeProperty('--fullscreen-content-width');
		}
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

		const attrs = [
			'data-fullscreen-hide-ribbon',
			'data-fullscreen-hide-tabs',
			'data-fullscreen-hide-sidebar',
			'data-fullscreen-hide-status',
			'data-fullscreen-hide-canvas-controls',
			'data-fullscreen-reveal-hover',
			'data-fullscreen-focus-mode',
			'data-fullscreen-typewriter',
			'data-fullscreen-transitions',
			'data-fullscreen-hide-mobile-top',
			'data-fullscreen-hide-inline-title',
			'data-fullscreen-hide-view-actions',
			'data-fullscreen-hide-scrollbars',
			'data-fullscreen-spotlight',
			'data-fullscreen-content-width',
		];
		attrs.forEach(a => body.removeAttribute(a));
		body.style.removeProperty('--fullscreen-content-width');

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
