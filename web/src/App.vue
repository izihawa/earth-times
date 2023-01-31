<template lang="pug">
div.d-flex.flex-column.min-vh-100
  header.col-lg-6.offset-lg-3.col-md-8.offset-md-2.col-sm-10.offset-sm-1
    nav.navbar.navbar-expand-sm
      .container-fluid
        a.navbar-brand(href="#") 🌍 Times
        .collapse.navbar-collapse
          ul.navbar-nav.me-auto
            li.nav-item
              select.form-select.form-select-sm(v-model="locale")
                option(value="en") 🇺🇸 EN
                option(value="ru") 🇷🇺 RU
        form.d-flex
          input.form-control.form-control-sm.me-2(v-model="query_box" type="search" placeholder="search by keywords..." aria-label="Search")
          button.btn.btn-sm.btn-outline-success(type="submit" @click.stop.prevent="current_size = 5; collapse(); query(true)") Search
  .mt-5.col-lg-4.offset-lg-4.col-md-6.offset-md-3.col-sm-8.offset-sm-2
    div(v-if="is_loading")
      loading-spinner
    div(v-else-if="is_loading_failed")
      connectivity-issues-view
    div(v-else-if="scored_documents.length > 0" )
      p.small.small.text-end {{ total_documents }} news
      hr
      div(v-for="scored_document in scored_documents" v-bind:key="scored_document.position")
        document-snippet(:scored_document="scored_document")
      div.text-center
        button.btn.btn-lg(@click="current_size += 5") ⬇️
    div(v-else)
      small Nothing found!
footer.footer.mt-auto.text-end.small.mb-3
  .container All data is provided by <a href="https://meduza.io">Meduza</a>. Driven by <a href="https://izihawa.github.io/summa">Summa</a>
</template>

<script lang="ts">
import * as bootstrap from "bootstrap";
import { defineComponent, toRaw } from "vue";
import ConnectivityIssuesView from "./components/ConnectivityIssues.vue";
import DocumentSnippet from "./components/DocumentSnippet.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";

export default defineComponent({
  name: "App",
  components: {
    ConnectivityIssuesView,
    DocumentSnippet,
    LoadingSpinner,
  },

  data() {
    return {
      is_loading: false,
      is_loading_failed: false,
      scored_documents: [],
      has_next: false,
      total_documents: null,
      locale: "ru",
      current_size: 5,
      query_box: "",
    };
  },
  async created() {
    await this.query(true);
  },
  methods: {
    async query(overwrite: boolean) {
      try {
        this.is_loading = overwrite;
        await this.search_service.init_guard;
        let collector_outputs = await this.feed();
        this.scored_documents =
          collector_outputs[0].collector_output.top_docs.scored_documents;
        this.total_documents =
          collector_outputs[1].collector_output.count.count;
        this.has_next = collector_outputs[0].collector_output.top_docs.has_next;
      } catch (e) {
        this.is_loading_failed = true;
      } finally {
        this.is_loading = false;
      }
    },
    collapse() {
      for (const el of Array.from(
        document.getElementsByClassName("collapse")
      )) {
        const collapse = new bootstrap.Collapse(el, { toggle: false });
        collapse.hide();
      }
    },
    async feed() {
      return await this.search_service.search([
        {
          index_alias: "meduza",
          query: {
            query: this.processed_query,
          },
          collectors: [
            {
              collector: {
                top_docs: {
                  limit: this.current_size,
                  scorer: { scorer: { order_by: "published_at" } },
                },
              },
            },
            { collector: { count: {} } },
          ],
        },
      ]);
    },
  },
  computed: {
    processed_query() {
      if (!this.query_box) {
        return { term: { field: "locale", value: this.locale } };
      } else {
        return {
          boolean: {
            subqueries: [
              {
                occur: 1, // must
                query: {
                  query: {
                    term: {
                      field: "locale",
                      value: this.locale,
                    },
                  },
                },
              },
              {
                occur: 1, // should,
                query: {
                  query: {
                    match: {
                      value: toRaw(this.query_box),
                    },
                  },
                },
              },
            ],
          },
        };
      }
    },
  },
  watch: {
    locale: {
      handler() {
        this.collapse();
        this.query(true);
      },
    },
    current_size: {
      handler() {
        this.query(false);
      },
    },
  },
});
</script>
