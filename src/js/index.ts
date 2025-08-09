import { mount } from "svelte";
import Auth from "../html/Auth.svelte";

const target = document.getElementById("app");

if (!target) {
    throw new Error('Target element "#app" not found');
}

const app = mount(Auth, {
    target,
});

export default app;
