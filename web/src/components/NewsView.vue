<template lang="pug">
header.col-lg-6.offset-lg-3.col-md-8.offset-md-2.col-sm-10.offset-sm-1
  nav.navbar.navbar-expand-sm
    .container-fluid
      a.navbar-brand(href="/") 🌍 Times
.mt-2.col-lg-4.offset-lg-4.col-md-6.offset-md-3.col-sm-8.offset-sm-2
  div(v-if="is_loading")
    loading-spinner
  div(v-else-if="is_loading_failed")
    connectivity-issues-view
  div(v-else)
    document-snippet(:scored_document="scored_document", :is_opened = "true")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DocumentSnippet from "./DocumentSnippet.vue";
import * as bootstrap from "bootstrap";
import ConnectivityIssuesView from "./ConnectivityIssues.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

export default defineComponent({
  name: "FeedView",
  components: {
    ConnectivityIssuesView,
    DocumentSnippet,
    LoadingSpinner,
  },
  data() {
    return {
      is_loading: true,
      is_loading_failed: false,
      scored_document: null,
    };
  },
  async created() {
    try {
      await this.search_service.init_guard;
      let collector_outputs = await this.get_item();
      this.scored_document =
        collector_outputs[0].collector_output.top_docs.scored_documents[0];
    } catch (e) {
      this.is_loading_failed = true;
    } finally {
      this.is_loading = false;
    }
  },
  methods: {
    async get_item() {
      return await this.search_service.search([
        {
          index_alias: "meduza",
          query: {
            query: { term: { field: "url", value: this.$route.params.url } },
          },
          collectors: [
            {
              collector: {
                top_docs: {
                  limit: 1,
                },
              },
            },
            { collector: { count: {} } },
          ],
        },
      ]);
    },
  },
});
</script>
