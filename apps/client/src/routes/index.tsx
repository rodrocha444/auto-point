import { useQueryClient } from "@tanstack/react-query";
import { useCreateUserMutation, useGetUsersQuery } from "../graphql/generated";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Componente,
});

function Componente() {
  const { data, isLoading, error } = useGetUsersQuery();
  const client = useQueryClient();

  const { mutate } = useCreateUserMutation({
    onSuccess: () => {
      alert("Criado com sucesso!");
      client.invalidateQueries({
        queryKey: useGetUsersQuery.getKey(),
      });
    },
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Deu ruim!</p>;

  return (
    <div className="bg-amber-200">
      <ul>
        {data?.users.map(user => (
          <div key={user.id}>
            {user.name} - {user.email}
          </div>
        ))}
      </ul>
      <button onClick={() => mutate({ name: "Novo", email: "novo@teste.com" })}>
        Criar User
      </button>
    </div>
  );
}
