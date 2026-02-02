import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "../../schema.gql",
  documents: "src/graphql/**/*.{ts,tsx,graphql}",
  generates: {
    "src/graphql/generated.ts": {
      plugins: [
        "add",
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        content: "// @ts-nocheck",
        fetcher: "./fetcher#fetcher",
        exposeQueryKeys: true,
        exposeFetcher: true,
        reactQueryVersion: 5,
      },
    },
  },
};

export default config;
