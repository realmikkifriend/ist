import App from "../html/Auth.svelte";
import type { SvelteComponent } from "svelte";

// eslint-disable-next-line
const target = document.getElementById("app");
if (!target) {
    throw new Error('Target element "#app" not found');
}
const app: SvelteComponent = new App({
    target,
});
export default app;
