/** Keep the standalone Web canvas and its pointer surface at the same 16:9 fit. */
export function fitPlaytestCanvas(): void {
    if (typeof document === 'undefined' || !document.documentElement.dataset.webChannel) return;
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
    if (!canvas) return;

    const aspect = 1280 / 720;
    const resize = () => {
        const width = Math.min(window.innerWidth, window.innerHeight * aspect);
        const height = width / aspect;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.margin = 'auto';
        const scale = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(width * scale));
        canvas.height = Math.max(1, Math.floor(height * scale));
    };
    window.addEventListener('resize', resize);
    resize();
}
