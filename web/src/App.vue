<template lang="pug">
div.d-flex.flex-column.min-vh-100
  router-view
footer.footer.mt-auto.text-end.small.mb-3
  .container All data is provided by <a href="https://meduza.io">Meduza</a>. Driven by <a href="https://izihawa.github.io/summa">Summa</a>
</template>

<script lang="ts">
import * as bootstrap from "bootstrap";
import { defineComponent } from "vue";
import { RouterView } from "vue-router";

export default defineComponent({
  name: "App",
  components: {
    RouterView,
  },
});
</script>
