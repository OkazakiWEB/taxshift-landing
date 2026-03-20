# TaxShift PRO — Landing Page

Landing page do **TaxShift PRO**, CRM tributário para escritórios contábeis especializados na Reforma Tributária (EC 132/2023).

## 🌐 Acesso

**GitHub Pages:** https://okazakiweb.github.io/taxshift-landing

## 📁 Estrutura

```
taxshift-landing/
├── index.html          # Landing page completa (single file)
└── README.md           # Este arquivo
```

## ✨ Funcionalidades da Landing

- Hero com preview do dashboard
- Seção de problemas e soluções
- 9 funcionalidades com badges por plano
- Como funciona em 4 passos
- Depoimentos de clientes
- **4 planos de preços** com toggle mensal/anual
- Tabela comparativa completa
- FAQ com accordion
- CTA final
- **Modais funcionais:** Login, Cadastro (3 passos), Enterprise, Demo, Contato
- **Páginas:** Termos de Uso, Política de Privacidade
- Menu mobile responsivo

## 💰 Modelo de Negócio

| Plano | Clientes | Preço |
|-------|----------|-------|
| Gratuito | 5 para sempre | R$ 0 |
| Básico | 20 | R$ 97/mês |
| Profissional | 60 | R$ 197/mês |
| Enterprise | Ilimitado | R$ 397/mês |

## 🚀 Deploy

### GitHub Pages (automático)
1. Vá em **Settings → Pages**
2. Source: **Deploy from branch → main**
3. Aguarde ~1 minuto
4. Acesse: `https://okazakiweb.github.io/taxshift-landing`

### Vercel (recomendado para produção)
```bash
npm i -g vercel
vercel --prod
```

## 🛠 Stack

- HTML5 + CSS3 + JavaScript vanilla
- Fontes: Instrument Serif + Geist + Geist Mono (Google Fonts)
- Single file, zero dependências, zero build step

## 📋 Próximos Passos

- [ ] Conectar formulário de cadastro ao backend (Supabase)
- [ ] Integrar Google OAuth
- [ ] Ativar pagamentos (Stripe)
- [ ] Configurar domínio personalizado (taxshift.com.br)
- [ ] Deploy do app principal (TaxShift CRM v9)

## 📄 Licença

Propriedade de **OkazakiWEB**. Todos os direitos reservados.

---

Desenvolvido com [Claude](https://claude.ai) · 2026
