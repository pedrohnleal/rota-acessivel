import * as React from "react";

interface Props {
  tokenPresent: boolean;
}

export function EnvBanner({ tokenPresent }: Props) {
  if (tokenPresent) return null;
  return (
    // Comentário de Acessibilidade: role="alert" e aria-live para leitura imediata em leitores de tela
    <div
      role="alert"
      aria-live="polite"
      className="absolute left-4 right-4 top-4 z-20 rounded-md border border-warning bg-white p-4 shadow-xl"
    >
      <p className="text-neutral-900">
        <strong>Sem token do Mapbox.</strong> Usando mapa básico do OpenStreetMap. Para rotas, selecione origem/destino no mapa ou informe lat,lng.
      </p>
    </div>
  );
}
