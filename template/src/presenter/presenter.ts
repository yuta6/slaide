import {
	type ClickConfig,
	DEFAULT_CLICK_CONFIG,
	DEFAULT_KEY_BINDINGS,
	DEFAULT_TOUCH_CONFIG,
	type KeyAction,
	type KeyBindings,
	type TouchConfig,
} from './types';

export class SlidePresenter {
	private current: number;
	private slides: HTMLElement[];
	private notes: HTMLElement | null;
	private keyBindings: KeyBindings;
	private clickConfig: ClickConfig;
	private touchConfig: TouchConfig;

	constructor(
		keyBindings: KeyBindings = DEFAULT_KEY_BINDINGS,
		clickConfig: ClickConfig = DEFAULT_CLICK_CONFIG,
		touchConfig: TouchConfig = DEFAULT_TOUCH_CONFIG,
	) {
		this.current = 0;
		this.slides = Array.from(document.querySelectorAll<HTMLElement>('[data-slide]'));
		this.notes = document.querySelector<HTMLElement>('[data-presenter-notes]');
		this.keyBindings = keyBindings;
		this.clickConfig = clickConfig;
		this.touchConfig = touchConfig;

		if (this.slides.length === 0) return;

		this.bindEvents();
		this.showSlide(0);
	}

	private bindEvents(): void {
		this.bindKeyboard();
		this.bindMouse();
		this.bindTouch();
	}

	private bindKeyboard(): void {
		document.addEventListener('keydown', (e: KeyboardEvent) => {
			if (this.shouldIgnoreKeyboardEvent(e)) return;

			const action = this.keyBindings[e.key];
			if (!action) return;

			e.preventDefault();
			this.executeAction(action);
		});
	}

	private bindMouse(): void {
		document.addEventListener('click', (e: MouseEvent) => {
			if (this.shouldIgnoreClickEvent(e)) return;

			if (e.clientX < window.innerWidth * this.clickConfig.prevZone) {
				this.prev();
			} else {
				this.next();
			}
		});
	}

	private bindTouch(): void {
		let touchStartX = 0;
		document.addEventListener('touchstart', (e: TouchEvent) => {
			touchStartX = e.touches[0].clientX;
		});
		document.addEventListener('touchend', (e: TouchEvent) => {
			const dx = e.changedTouches[0].clientX - touchStartX;
			if (Math.abs(dx) > this.touchConfig.minSwipeDelta) {
				dx > 0 ? this.prev() : this.next();
			}
		});
	}

	private executeAction(action: KeyAction): void {
		const handlers: Record<KeyAction, () => void> = {
			next: () => this.next(),
			prev: () => this.prev(),
			fullscreen: () => this.toggleFullscreen(),
			notes: () => this.toggleNotes(),
			home: () => this.goTo(0),
			end: () => this.goTo(this.slides.length - 1),
		};
		handlers[action]();
	}

	private showSlide(index: number): void {
		if (index < 0 || index >= this.slides.length) return;
		for (const slide of this.slides) slide.classList.remove('active');
		this.slides[index].classList.add('active');
		this.current = index;
		this.updateProgress();
		this.updateNotes();
	}

	private updateProgress(): void {
		const bar = document.querySelector<HTMLElement>('[data-progress-bar]');
		if (bar) bar.style.width = `${((this.current + 1) / this.slides.length) * 100}%`;

		const counter = document.querySelector('[data-slide-counter]');
		if (counter) counter.textContent = `${this.current + 1} / ${this.slides.length}`;
	}

	private updateNotes(): void {
		const notesText = this.slides[this.current].dataset.slideNotes || '';
		if (this.notes) this.notes.textContent = notesText;
	}

	private next(): void {
		this.showSlide(this.current + 1);
	}

	private prev(): void {
		this.showSlide(this.current - 1);
	}

	private goTo(i: number): void {
		this.showSlide(i);
	}

	private toggleFullscreen(): void {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	}

	private toggleNotes(): void {
		if (this.notes) this.notes.classList.toggle('visible');
	}

	private shouldIgnoreKeyboardEvent(e: KeyboardEvent): boolean {
		if (e.metaKey || e.ctrlKey || e.altKey) return true;
		const target = e.target;
		if (!(target instanceof HTMLElement)) return false;
		if (target.isContentEditable) return true;
		const tagName = target.tagName;
		return (
			tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'BUTTON'
		);
	}

	private shouldIgnoreClickEvent(e: MouseEvent): boolean {
		const target = e.target;
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest('[data-presenter-ui]') ||
				target.closest('a, button, input, textarea, select, label, summary') ||
				window.getSelection()?.toString(),
		);
	}
}
