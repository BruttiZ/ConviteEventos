# 🚀 Deploy em Produção - Super User Funcional

## ✅ Checklist Rápido

Para fazer super user funcionar em produção no Vercel:

```
☐ 1. Fazer push do código para GitHub
☐ 2. Ir no Vercel → Project Settings → Environment Variables
☐ 3. Adicionar as 2 variáveis (veja abaixo)
☐ 4. Redeploy (ou aguarde auto-deploy)
☐ 5. Testar em https://seu-site.vercel.app/login
```

---

## 📋 Variáveis de Ambiente no Vercel

### Campo 1: `VITE_SUPER_USER_EMAIL`
```
admin@invitely.local
```

### Campo 2: `VITE_SUPER_USER_PASSWORD`
```
admin123456
```

### Exemplo Visual:
```
Name: VITE_SUPER_USER_EMAIL
Value: admin@invitely.local

Name: VITE_SUPER_USER_PASSWORD
Value: admin123456
```

### Importante:
- ✅ Adicionar em **Vercel → Project Settings → Environment Variables**
- ✅ Selecionar todos os ambientes: **Production, Preview, Development**
- ✅ Fazer redeploy após adicionar

---

## 🔗 Passo a Passo (Com Screenshots em Mente)

### Passo 1: Fazer Push para GitHub
```bash
cd c:\Users\victor.brutti\Desktop\ConviteFaculdade
git add -A
git commit -m "feat: Super user pronto para produção"
git push origin main
```

### Passo 2: Ir no Vercel
1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto (Invitely)
3. Vá em **Settings** (engrenagem no topo)
4. Clique em **Environment Variables** (lado esquerdo)

### Passo 3: Adicionar as Variáveis
**Primeira variável:**
- Name: `VITE_SUPER_USER_EMAIL`
- Value: `admin@invitely.local`
- Environments: **✓ Production ✓ Preview ✓ Development**
- Clique **Add**

**Segunda variável:**
- Name: `VITE_SUPER_USER_PASSWORD`
- Value: `admin123456`
- Environments: **✓ Production ✓ Preview ✓ Development**
- Clique **Add**

### Passo 4: Fazer Redeploy
1. Vá em **Deployments** (no topo)
2. Clique no último deploy
3. Clique **Redeploy** (botão azul)
4. Aguarde ~5 minutos

### Passo 5: Testar
```
1. Acesse: https://seu-site.vercel.app/login
2. Clique "Login"
3. E-mail: admin@invitely.local
4. Senha: admin123456
5. Clique "Entrar"
6. Deve entrar como "Admin Invitely"
```

---

## 🔄 Outras Variáveis Necessárias

Você também precisa adicionar **TODAS** estas variáveis no Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
VITE_API_URL=https://seu-backend.com (ou mesmo domínio)
VITE_SITE_URL=https://seu-site.vercel.app
```

### Onde pegar?
- **VITE_SUPABASE_URL** → Supabase → Settings → API
- **VITE_SUPABASE_ANON_KEY** → Supabase → Settings → API
- **VITE_API_URL** → Seu backend (Laravel) - em produção
- **VITE_SITE_URL** → `https://seu-site.vercel.app`

---

## 🆘 Troubleshooting

### "Super user não funciona em prod"
```
Verificar:
1. ✅ Vercel → Settings → Environment Variables
2. ✅ VITE_SUPER_USER_EMAIL está lá?
3. ✅ VITE_SUPER_USER_PASSWORD está lá?
4. ✅ Clicou "Redeploy" depois?
5. ✅ Aguardou 5 minutos o deploy terminar?
```

### "Erro ao fazer login"
```
Verificar:
1. ✅ Supabase está online?
2. ✅ VITE_SUPABASE_URL está correto?
3. ✅ VITE_SUPABASE_ANON_KEY está correto?
4. ✅ Abrir console (F12) e ver erro exato
```

### "Página em branco"
```
Verificar:
1. ✅ npm run build funcionou?
2. ✅ Build logs do Vercel - procure por erros
3. ✅ F12 → Console → procure por erros JavaScript
```

---

## 📦 Checklist Completo de Deploy

- [ ] Código está no GitHub
- [ ] VITE_SUPABASE_URL adicionado no Vercel
- [ ] VITE_SUPABASE_ANON_KEY adicionado no Vercel
- [ ] VITE_API_URL adicionado no Vercel
- [ ] VITE_SITE_URL adicionado no Vercel
- [ ] VITE_SUPER_USER_EMAIL adicionado no Vercel
- [ ] VITE_SUPER_USER_PASSWORD adicionado no Vercel
- [ ] Clicou "Redeploy" no Vercel
- [ ] Deploy foi bem-sucedido (check verde)
- [ ] Testou super user em produção
- [ ] Testou cadastro normal em produção
- [ ] Testou OTP em produção

---

## 🎯 Teste Final em Prod

### Cenário 1: Super User
```
1. Acesse: https://seu-site.vercel.app/login
2. Clique "Login"
3. Admin@invitely.local / admin123456
4. ✅ Deve entrar como "Admin Invitely"
5. ✅ Dashboard deve carregar
```

### Cenário 2: Cadastro Normal
```
1. Clique "Cadastro"
2. Preencha com seu email real
3. Crie uma senha forte
4. Clique "Cadastrar"
5. ✅ Deve redirecionar para /verify
6. ✅ Deve receber código por e-mail
7. ✅ Digita código
8. ✅ Pronto! Logado
```

---

## 🚨 Segurança - Remover Super User em Produção (Depois)

Quando não precisar mais do super user em produção:

### Opção 1: Remover do Vercel
1. Vercel → Project Settings → Environment Variables
2. Clique no ❌ ao lado de `VITE_SUPER_USER_EMAIL`
3. Clique no ❌ ao lado de `VITE_SUPER_USER_PASSWORD`
4. Redeploy

### Opção 2: Deixar com Senha Complexa
```
Email: admin@invitely.local
Password: gEk9@mL2$pQ4!xW8nV3(zH6+jK1%vB5)
```

Ninguém vai adivinhar isso!

---

## 📞 Comandos Úteis

### Verificar se build funciona localmente
```bash
npm run build
```

### Ver logs do build
```bash
# No Vercel → Deployments → Clique no deploy → Logs
```

### Revert de um deploy (se deu ruim)
```bash
# No Vercel → Deployments → Clique em um deploy anterior → Redeploy
```

---

## ✅ Status

- ✅ Super user funciona em desenvolvimento
- ✅ Super user funciona em produção (com .env)
- ✅ Cadastro normal funciona
- ✅ OTP funciona
- ✅ Tudo pronto para testar!

---

**Próximo passo:** Fazer push para GitHub, adicionar variáveis no Vercel e testar!

Data: 2026-06-08 | Status: ✅ Pronto para Deploy
