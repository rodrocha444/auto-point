import { useQueryClient } from "@tanstack/react-query";
import { useCreateUserMutation, useGetUsersQuery } from "./graphql/generated";

export function Componente() {
  const { data, isLoading, error } = useGetUsersQuery();
  const client = useQueryClient();

  const { mutate } = useCreateUserMutation({
    onSuccess: () => {
      // O codegen gera query keys para você invalidar o cache fácil
      // queryClient.invalidateQueries(useGetUsersQuery.getKey())
      alert("Criado com sucesso!");
      client.invalidateQueries({
        queryKey: useGetUsersQuery.getKey(),
      });
    },
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Deu ruim!</p>;

  return (
    <div>
      <ul>
        {data?.users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
      <button onClick={() => mutate({ name: "Novo", email: "novo@teste.com" })}>Criar User</button>
    </div>
  );
}
