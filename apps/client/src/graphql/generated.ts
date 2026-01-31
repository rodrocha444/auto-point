import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { fetcher } from "./fetcher";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type Mutation = {
  __typename?: "Mutation";
  createUser: User;
};

export type MutationCreateUserArgs = {
  email: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
};

export type Query = {
  __typename?: "Query";
  users: Array<User>;
};

export type User = {
  __typename?: "User";
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
};

export type GetUsersQueryVariables = Exact<{ [key: string]: never }>;

export type GetUsersQuery = {
  __typename?: "Query";
  users: Array<{ __typename?: "User"; id: string; name: string; email: string }>;
};

export type CreateUserMutationVariables = Exact<{
  name: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
}>;

export type CreateUserMutation = {
  __typename?: "Mutation";
  createUser: { __typename?: "User"; id: string; name: string };
};

export const GetUsersDocument = `
    query GetUsers {
  users {
    id
    name
    email
  }
}
    `;

export const useGetUsersQuery = <TData = GetUsersQuery, TError = unknown>(
  variables?: GetUsersQueryVariables,
  options?: Omit<UseQueryOptions<GetUsersQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetUsersQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetUsersQuery, TError, TData>({
    queryKey: variables === undefined ? ["GetUsers"] : ["GetUsers", variables],
    queryFn: fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables),
    ...options,
  });
};

useGetUsersQuery.getKey = (variables?: GetUsersQueryVariables) =>
  variables === undefined ? ["GetUsers"] : ["GetUsers", variables];

export const CreateUserDocument = `
    mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
  }
}
    `;

export const useCreateUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<CreateUserMutation, TError, CreateUserMutationVariables, TContext>,
) => {
  return useMutation<CreateUserMutation, TError, CreateUserMutationVariables, TContext>({
    mutationKey: ["CreateUser"],
    mutationFn: (variables?: CreateUserMutationVariables) =>
      fetcher<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, variables)(),
    ...options,
  });
};
