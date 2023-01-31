<template lang="pug">
.container
  h5(role="button" data-bs-toggle="collapse" :data-bs-target="'#body-' + document.url" aria-expanded="false" :aria-controls="'body-' + document.url") {{ document.title }}
  div.mt-3.collapse(:id="'body-' + document.url")
    div.small(v-html="body")
  .text-end.small {{ date }}
hr
</template>

<script lang="ts">
// @ts-nocheck
import { defineComponent } from "vue";

export default defineComponent({
  name: "DocumentSnippet",
  props: {
    scored_document: {
      type: Object,
      required: true,
    },
  },
  computed: {
    document() {
      return JSON.parse(this.scored_document.document);
    },
    date() {
      return new Date(this.document.published_at * 1000).toLocaleString();
    },
    body() {
      return this.document.body;
    },
  },
});
</script>
