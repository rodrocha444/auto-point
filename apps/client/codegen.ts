import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "../../schema.gql",
  documents: "src/graphql/**/*.{ts,tsx,graphql}",
  generates: {
    "src/graphql/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: "./fetcher#fetcher",
        exposeQueryKeys: true,
        reactQueryVersion: 5,
      },
    },
  },
};

export default config;
