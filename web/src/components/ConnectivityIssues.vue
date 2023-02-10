<template lang="pug">
div.font-monospace(v-if="is_localhost")
  p Is local IPFS daemon enabled?
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { utils } from "summa-wasm";

export default defineComponent({
  name: "ConnectivityIssues",
  computed: {
    is_localhost() {
      return utils.get_ipfs_url().includes("localhost");
    },
  },
});
</script>
