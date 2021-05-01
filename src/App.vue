<template>
  <div id="app">
    <InputText type="text" placeholder="input" />
    <button @click="testProbe()">Test Probe</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useIpcEventHandler } from "./util";
import InputText from "primevue/inputtext";

export default defineComponent({
  name: "App",
  components: {
    InputText,
  },
  setup() {
    useIpcEventHandler<string[]>("test-probe-reply", (event, args) => {
      alert(JSON.stringify(args));
    });

    return {
      testProbe() {
        window.ipcRenderer.send("test-probe");
      },
    };
  },
});
</script>

<style>
body {
  background-color: var(--surface-b);
  color: var(--text-color);
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}
</style>
