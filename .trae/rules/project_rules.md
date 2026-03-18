# Project Rules and Guidelines

Este arquivo define as regras de desenvolvimento, UX/UI, e boas práticas para o projeto Gabinete Online V2.
Siga estas diretrizes para garantir consistência, performance e manutenibilidade.

## 1. Visão Geral e Tecnologias
- **Framework**: React 19 (com Vite)
- **Linguagem**: TypeScript (Strict Mode)
- **Estilização**: Tailwind CSS v4 (Variáveis CSS nativas)
- **Roteamento**: React Router v7
- **Gerenciamento de Estado**: Zustand (Global), TanStack Query (Server State)
- **Validação**: Zod
- **Ícones**: SVG components ou biblioteca de ícones

## 2. Arquitetura Modular
Adote a estrutura modular orientada a features para novas funcionalidades:

```
src/
├── features/           # Módulos independentes por funcionalidade
│   └── [feature-name]/
│       ├── components/  # UI específica da feature
│       ├── hooks/       # Lógica encapsulada e custom hooks
│       ├── services/    # Chamadas API e lógica de negócio
│       ├── types/       # Definições de tipos locais
│       └── index.ts     # API pública do módulo (Barrel export)
├── components/     # UI Kit (Botões, Inputs, Cards, Modais, Header, Form, Commom, Charts)
├── hooks/          # Hooks utilitários globais (useTheme, useAuth)
├── utils/          # Funções helper puras
├── types/          # Tipos globais
└── core/           # Configurações globais (Providers, Router, Configs)
```

## 3. Design System e UI (Tailwind CSS v4)

### Cores (Variáveis CSS)
Use as variáveis definidas em `src/index.css` via classes utilitárias ou `@apply`. O design system suporta modo claro e escuro.

- **Brand (Primária)**: `bg-brand-500`, `text-brand-600` (Azul principal: `#465fff`)
- **Neutros (Gray)**: 
    - `bg-gray-50` a `bg-gray-900`
    - `text-gray-500` (texto secundário), `text-gray-900` (títulos)
- **Semânticas**: 
    - Sucesso: `text-success-500`, `bg-success-50`
    - Erro/Aviso: `text-orange-500` (ou similar definido no tema)
- **Dark Mode**: 
    - Use o prefixo `dark:` (ex: `dark:bg-gray-800`, `dark:text-white`).
    - O tema escuro é ativado via classe `.dark` no elemento raiz.

### Tipografia
A fonte padrão é **Outfit** (`font-outfit`). Use os tamanhos pré-definidos para consistência:

- **Títulos**:
    - 2XL: `text-title-2xl` (72px)
    - XL: `text-title-xl` (60px)
    - LG: `text-title-lg` (48px)
    - MD: `text-title-md` (36px)
    - SM: `text-title-sm` (30px)
- **Corpo**:
    - XL: `text-theme-xl` (20px)
    - SM: `text-theme-sm` (14px) - *Padrão para texto corrido*
    - XS: `text-theme-xs` (12px) - *Legendas e detalhes*

### Espaçamentos e Layout
- **Grid System**: Use o sistema de grid do Tailwind (`grid`, `gap-4`, `col-span-x`) para layouts.
- **Breakpoints**:
    - `2xsm`: 375px
    - `xsm`: 425px
    - `sm`: 640px
    - `md`: 768px
    - `lg`: 1024px
    - `xl`: 1280px
    - `2xl`: 1536px
    - `3xl`: 2000px

## 4. Desenvolvimento de Componentes

### Padrões de Código
- **Componentes Funcionais**: Use `React.FC<Props>` ou funções declaradas.
- **Tipagem Estrita**: Defina interfaces para todas as props. Evite `any`.
- **Nomes de Arquivos**: PascalCase para componentes (`UserProfile.tsx`), camelCase para hooks/utils (`useAuth.ts`).
- **Exportação**: Prefira `export default` para componentes de página e `export` nomeado para componentes reutilizáveis/utils.
- Utilize sempre o pattern Component Composition para criação de componentes, páginas etc.

### Estrutura de Componente Recomendada
```tsx
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  onClick?: () => void;
}

export const Button = ({ 
  children, 
  variant = "primary", 
  size = "md",
  onClick 
}: ButtonProps) => {
  // Lógica e classes condicionais
  return <button onClick={onClick} className="...">...</button>;
};
```

### Acessibilidade (a11y)
- Use elementos HTML semânticos sempre que possível.
- Garanta que elementos interativos tenham estados de `focus`, `hover` e `active`.
- Adicione `aria-label` em botões apenas com ícones.
- Verifique o contraste de cores, especialmente no modo escuro.

## 5. Gerenciamento de Estado e Dados
- **Server State (TanStack Query)**:
    - Use para buscar, armazenar em cache e atualizar dados assíncronos.
    - Implemente `stale-while-revalidate` para UX fluida.
    - Use `useMutation` para operações de escrita (POST, PUT, DELETE).
- **Client State (Zustand)**:
    - Use para estado global da interface (tema, preferências, dados de sessão).
    - Crie stores modulares e tipadas.

## 6. Offline-First & Sincronização
- **IndexedDB**: Utilize para armazenar dados essenciais localmente, permitindo funcionamento offline.
- **Sincronização em Background**: Implemente filas de operações para sincronizar dados quando a conexão for restabelecida.
- **Feedback Visual**: Indique claramente ao usuário quando ele está offline ou quando dados estão sendo sincronizados.

## 7. Performance
- **Code Splitting**: Utilize `lazy` loading para rotas e componentes pesados.
- **Otimização de Renderização**: Use `React.memo`, `useMemo` e `useCallback` para evitar re-renderizações desnecessárias.
- **Assets**: Otimize imagens e SVGs. Use `loading="lazy"` para imagens abaixo da dobra.

## 8. Segurança
- **Validação**: Valide todos os inputs e dados externos com **Zod**.
- **Dados Sensíveis**: Criptografe dados sensíveis armazenados localmente (IndexedDB).
- **Chaves**: Nunca commite chaves de API ou segredos no código (use variáveis de ambiente `.env`).