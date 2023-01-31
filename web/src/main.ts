import "bootstrap";
import { createApp } from "vue";
import App from "./App.vue";
import { num_threads } from "./options";
import { SearchService } from "./services/search-service";

import "./scss/styles.scss";

const app = createApp(App);

app.config.globalProperties.search_service = new SearchService({
  num_threads: num_threads,
});
app.mount("#app");
