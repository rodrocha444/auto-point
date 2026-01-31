/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from "graphql-request";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Retorna "http://localhost:3001/api/graphql"
    return `${window.location.origin}/api/graphql`;
  }
  // Fallback para caso rode fora do navegador (SSR/Testes)
  return "http://localhost:3000/graphql";
};

export const graphQLClient = new GraphQLClient(getBaseUrl());

export const fetcher = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  headers?: RequestInit["headers"],
) => {
  return async () => {
    try {
      const res = await graphQLClient.request<TData>(
        query,
        variables as any,
        headers as any,
      );
      return res;
    } catch (err) {
      console.error("❌ ERRO NO REQUEST:", err);
      throw err;
    }
  };
};
