<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <button @click="testProbe()">Test Probe</button>
  <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import { useIpcEventHandler } from "./util";

export default defineComponent({
  name: "App",
  components: {
    HelloWorld,
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
