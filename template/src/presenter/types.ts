export type KeyAction = 'next' | 'prev' | 'fullscreen' | 'notes' | 'home' | 'end';

export interface KeyBindings {
	[key: string]: KeyAction;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
	ArrowRight: 'next',
	ArrowDown: 'next',
	' ': 'next',
	Spacebar: 'next',
	ArrowLeft: 'prev',
	ArrowUp: 'prev',
	f: 'fullscreen',
	F: 'fullscreen',
	p: 'notes',
	P: 'notes',
	Home: 'home',
	End: 'end',
};

export interface TouchConfig {
	minSwipeDelta: number; // pixels
}

export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
	minSwipeDelta: 50,
};

export interface ClickConfig {
	prevZone: number; // percentage of width
}

export const DEFAULT_CLICK_CONFIG: ClickConfig = {
	prevZone: 0.2,
};
