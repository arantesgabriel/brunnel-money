# Brunnel Finanças Design System

## Overview

Tema claro e restrito para uma ferramenta doméstica sofisticada. Cena de referência: um casal conferindo o mês no celular à noite, em casa, querendo uma decisão rápida e serena. Fundo branco verdadeiro, superfícies frias discretas e azul mineral reservado a ação, seleção e foco.

## Colors

Tokens semânticos em OKLCH definidos em `app/globals.css`. Azul mineral é a identidade principal; âmbar, verde e vermelho aparecem apenas como sinais semânticos. Texto principal busca contraste 7:1 e nenhum estado depende exclusivamente de cor.

## Typography

Uma única família sans de produto, Geist com fallback do sistema. Escala fixa de 12, 14, 16, 18, 22, 28 e 36 px. Valores usam algarismos tabulares. Títulos são equilibrados e prosa fica limitada a 70 caracteres.

## Shape and spacing

Base de 4 px. Controles usam raios de 8–12 px; agrupamentos, 14–16 px. Pills somente para status e tags. Elevação curta e funcional; borda e sombra difusa nunca competem.

## Components

Primitivas de formulário e feedback compartilham estados default, hover, focus-visible, active, disabled, loading e error. No mobile, listas substituem tabelas e a navegação inferior respeita safe areas. No desktop, sidebar persistente e densidade maior.

- `MonthSwitcher` é o seletor canônico de competência nas páginas financeiras.
- `CategoryIcon` concentra ícone, tom semântico e cor de gráfico de cada categoria.
- Controles de competência e ações primárias usam 44 px, 8 px de separação e o mesmo alinhamento no cabeçalho; no mobile, grupos com quatro ações viram uma grade 2×2.
- Legendas de categoria derivam cor dos mesmos tokens usados no gráfico, com uma variante escura para manter contraste AA.
- Categorias podem ser criadas e editadas em Configurações; superfícies de orçamento oferecem atalho global e edição contextual por linha.
- Páginas financeiras usam `resource-page-header`, resumo visual compacto e uma superfície principal de trabalho.
- Cards de resumo usam raio de 16–18 px, fundo branco e sombra curta; bordas ficam reservadas a divisores internos.
- Teal identifica ação, seleção e progresso normal. Verde, âmbar e vermelho comunicam estados sem depender apenas de cor.

## Motion

Transições de 150–220 ms comunicam abertura e mudança de estado. `prefers-reduced-motion` remove deslocamentos e reduz transições a crossfade instantâneo.

## Content

Português brasileiro direto e não julgador. Títulos dizem o que a pessoa pode fazer ou entender. Confirmações destrutivas explicam impacto e recuperação.
