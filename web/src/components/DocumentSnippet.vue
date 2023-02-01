<template lang="pug">
.container.snippet
  h5(role="button" data-bs-toggle="collapse" :data-bs-target="'#body-' + document.url" aria-expanded="false" :aria-controls="'body-' + document.url") {{ document.title }}
  div.mt-3.collapse(:id="'body-' + document.url" :class="is_opened ? 'show' : ''")
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
    is_opened: Boolean,
  },
  computed: {
    document() {
      return JSON.parse(this.scored_document.document);
    },
    date() {
      return new Date(this.document.published_at * 1000).toLocaleString();
    },
    body() {
      var el = document.createElement("html");
      el.innerHTML = this.document.body.replace(/<img .*?>/g, "");
      for (let link of el.getElementsByTagName("a")) {
        let href = link.getAttribute("href");
        const replaced_href = href.replaceAll(
          /https?:\/\/meduza\.io\/((?:feature|news).*)/g,
          "#/meduza/$1"
        );
        link.setAttribute("href", replaced_href);
      }
      return el.innerHTML;
    },
  },
});
</script>
