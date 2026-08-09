import cache from "@opennextjs/cloudflare/kv-cache";

const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: async () => cache,
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
