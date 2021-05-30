<script lang="ts">
import { useIpcRendererChannel } from '@/util';
import { defineComponent, ref } from '@vue/composition-api';

export const ResetSettings = defineComponent({
  name: 'ResetSettings',
  setup() {
    const resetDialog = ref(false);
    const { send: sendStoreReset } = useIpcRendererChannel('store-reset');
    return {
      resetDialog,
      resetStore: () => {
        sendStoreReset();
        resetDialog.value = false;
      },
    };
  },
});
export default ResetSettings;
</script>

<template>
  <v-dialog max-width="75%" v-model="resetDialog">
    <template #activator="{ on, attrs }">
      <v-btn color="red" class="ml-auto d-block" v-bind="attrs" v-on="on">
        <v-icon class="mr-2"> mdi-eraser-variant </v-icon>
        Reset all to defaults
      </v-btn>
    </template>
    <v-card>
      <v-card-title> Are you sure? </v-card-title>
      <v-card-text>
        Resetting settings to their defaults will kill the miner if it is
        running
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn text @click="resetDialog = false"> Cancel </v-btn>
        <v-btn color="red" text @click="resetStore()"> Reset </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
