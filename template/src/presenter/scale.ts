/**
 * Scale the slide scaler to fit the viewport.
 * Centers the slide and applies transform origin at top-left.
 */
export function scaleToFit(): void {
	const scaler = document.querySelector<HTMLElement>('.slide-scaler');
	const firstSlide = document.querySelector<HTMLElement>('[data-slide]');
	if (!scaler || !firstSlide) return;

	const sw = parseInt(firstSlide.style.getPropertyValue('--slide-width'), 10) || 1920;
	const sh = parseInt(firstSlide.style.getPropertyValue('--slide-height'), 10) || 1080;
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	const scale = Math.min(vw / sw, vh / sh);
	const offsetX = (vw - sw * scale) / 2;
	const offsetY = (vh - sh * scale) / 2;

	scaler.style.width = `${sw}px`;
	scaler.style.height = `${sh}px`;
	scaler.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

export function setupScaling(): void {
	window.addEventListener('resize', scaleToFit);
	window.addEventListener('load', scaleToFit);
	scaleToFit();
}
