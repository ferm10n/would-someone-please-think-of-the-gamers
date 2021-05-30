<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
// import {
//   useRemoteStoreProp,
//   refreshStore,
//   useIpcRendererChannel,
// } from './util';

export const ProfileConfig = defineComponent({
  name: 'ProfileConfig',
  setup() {
    const profiles = ref([
      {
        type: 'user',
        name: 'Miner',
        startCmd: '',
        minerPath: '',
      },
      {
        type: 'default',
        name: 'Default',
        startCmd: '',
        minerPath: '',
      },
    ]);

    const visibleProfileIdx = ref(0);
    // ensure the visible profile is an actual profile
    watch(profiles, () => {
      if (visibleProfileIdx.value > profiles.value.length - 1) {
        visibleProfileIdx.value = profiles.value.length - 1;
      }
    });
    const visibleProfile = computed(
      () => profiles.value[visibleProfileIdx.value]
    );
    function addProfile() {
      profiles.value.push({
        name: `New Profile ${profiles.value.length + 1}`,
        type: 'user',
        startCmd: '',
        minerPath: '',
      });
    }
    return {
      profiles,
      visibleProfileIdx,
      visibleProfile,
      required: (val: string | null) =>
        val && val.length > 0 ? true : 'Required',
      // TODO doesn't work
      dedupe: (val: string | null) => {
        if (val) {
          // check each of the profiles for a duplicate
          for (const profile of profiles.value) {
            // don't check itself
            if (profile === visibleProfile.value) {
              continue;
            }

            // duplicate?
            if (profile.name === val) {
              return 'Profile names must be unique';
            }
          }
        }
        return true;
      },
      addProfile,
    };
  },
});
export default ProfileConfig;
</script>

<template>
  <div>
    <v-card outlined style="background: none">
      <v-card-title style="background: #1e1e1e"> Profiles </v-card-title>
      <v-tabs v-model="visibleProfileIdx">
        <v-tab v-for="(profile, idx) of profiles" :key="idx">
          {{ profile.name }}
        </v-tab>
        <v-icon @click="addProfile()">mdi-plus-box</v-icon>
        <!-- <v-btn icon tile>
        </v-btn> -->
      </v-tabs>
      <v-tabs-items
        v-model="visibleProfileIdx"
        class="ma-4"
        style="background: none"
      >
        <v-tab-item v-for="(profile, profileIdx) of profiles" :key="profileIdx">
          <v-text-field
            :value="profile.name"
            @change="profile.name = ($event || '').trim()"
            label="Profile name"
            filled
            prepend-icon="mdi-alphabetical"
            :rules="[required, dedupe]"
            @click:append="pickPath('minerPath')"
          />
          <v-text-field
            :value="profile.minerPath"
            @change="profile.minerPath = $event"
            label="Path to miner executable"
            filled
            prepend-icon="mdi-pickaxe"
            append-icon="mdi-folder-open"
            :rules="[required]"
            @click:append="pickPath('minerPath')"
          />
          <v-text-field
            label="Start Command (optional)"
            :value="profile.startCmd"
            @change="profile.startCmd = $event"
            filled
            hide-details
            prepend-icon="mdi-console-line"
            append-icon="mdi-folder-open"
            @click:append="pickPath('startCmd')"
          />
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </div>
</template>
