/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from "graphql-request";

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== "undefined") {
    return new URL(apiUrl, window.location.origin).toString();
  }

  return apiUrl || "http://localhost:3000/graphql";
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
