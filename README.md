# Shell e microfrontends

Quatro apps Vite ligados com [`@module-federation/vite`](https://github.com/module-federation/vite). O shell hospeda os remotes. Todos usam o design system [Nucleus](https://github.com/isaac545454/ds-nucleo-web-components) e o barramento [`@isaac545454/frontend-events`](https://github.com/isaac545454/frontend-events). Os dados vêm da [API do Rick and Morty](https://rickandmortyapi.com).

| App | Pasta | Porta | Papel |
| --- | --- | --- | --- |
| Shell | `apps/shell` | 4100 | Hospeda os três remotes e mostra os eventos |
| Personagens | `apps/characters` | 4101 | React |
| Locais | `apps/locations` | 4102 | Vue |
| Episódios | `apps/episodes` | 4103 | Angular |

Escolher um personagem publica `character:selected`. O app Vue marca o local e o Angular lista os episódios daquele personagem. Escolher um local ou episódio filtra os personagens no React. `selection:cleared` zera a seleção.

## Subir

```bash
pnpm install
pnpm dev
```

Abra http://localhost:4100. Cada remote também abre sozinho na porta dele.

`pnpm install` clona Nucleus e frontend-events em `vendor/` e compila os dois. A primeira vez demora por causa do build do Stencil.
