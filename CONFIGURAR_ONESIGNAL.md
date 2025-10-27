# Como Configurar OneSignal (Notificações Push)

Este guia mostra como configurar as notificações push usando OneSignal.

## ⚠️ Importante

As notificações push são **OPCIONAIS**. Se você não quiser usar, não precisa configurar nada. O app funcionará normalmente sem notificações.

---

## 📱 Passo a Passo

### 1. Criar Conta no OneSignal

1. Acesse [https://onesignal.com](https://onesignal.com)
2. Clique em "Get Started" (ou "Sign Up")
3. Crie uma conta gratuita
4. Faça login

### 2. Criar um Novo App

1. No dashboard, clique em **"New App/Website"**
2. Escolha um nome: `Manicure Studio Lite` (ou o nome que preferir)
3. Clique em **"Create App"**

### 3. Configurar para Web Push

1. Selecione **"Web Push"** como plataforma
2. Escolha **"Typical Site"**
3. Preencha os campos:
   - **Site Name:** Manicure Studio Lite
   - **Site URL:** `https://seudominio.com` (ou seu IP se não tiver domínio ainda)
4. Clique em **"Save"**

### 4. Obter as Credenciais

1. No dashboard do seu app, vá em **Settings** (Configurações)
2. Clique em **Keys & IDs**
3. Você verá duas informações importantes:
   - **OneSignal App ID** - Um código como `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **REST API Key** - Uma chave longa

**COPIE ESSES DOIS VALORES!** Você vai precisar deles.

### 5. Adicionar as Credenciais no Servidor

No seu servidor VPS, edite o arquivo `.env`:

```bash
cd /var/www/manicure-studio
nano .env
```

Adicione as credenciais:

```env
NODE_ENV=production
PORT=5000

# OneSignal - Cole suas credenciais aqui
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_API_KEY=sua-rest-api-key-aqui

# OneSignal Frontend - Use o mesmo App ID
VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Salve e saia (`Ctrl+O`, Enter, `Ctrl+X`).

### 6. Reiniciar a Aplicação

```bash
pm2 restart manicure-studio
```

### 7. Verificar se Funcionou

```bash
pm2 logs manicure-studio
```

Você deve ver no log:
```
✅ OneSignal service initialized successfully
```

Se ver isso, significa que está funcionando!

---

## 🔔 Como Usar as Notificações

### Botão de Ativar Notificações no App

Quando você acessar o app, verá um **ícone de sino (🔔)** no canto superior direito.

1. Clique no ícone do sino
2. O navegador vai pedir permissão para enviar notificações
3. Clique em **"Permitir"**
4. Pronto! Você receberá notificações dos agendamentos

### Botão de Instalar App

Você também verá um botão **"Instalar"** (ou ícone de download 📥).

1. Clique nele
2. Confirme a instalação
3. O app será adicionado à sua tela inicial como um app nativo
4. Você poderá abrir o app sem precisar do navegador

### Tipos de Notificações Automáticas

O sistema enviará notificações automaticamente:

1. **Lembretes de Agendamento:**
   - 24 horas antes do horário marcado
   - 3 horas antes
   - 1 hora antes

2. **Clientes Inativos:**
   - Todos os dias às 10h da manhã
   - Verifica clientes que não vieram há mais de 30 dias
   - Envia mensagem de reengajamento

---

## 🔧 Configurações Avançadas do OneSignal

### Personalizar Mensagens de Lembrete

No dashboard do OneSignal:

1. Vá em **Messages** → **Automated**
2. Clique em **New Automated Message**
3. Configure cada tipo de lembrete:

**Lembrete 24h antes:**
- **Name:** Lembrete 24h
- **Audience:** All Subscribers
- **Delivery Schedule:** Send based on User's Time Zone
- **Message:**
  - Título: "Lembrete de Agendamento 📅"
  - Mensagem: "Seu atendimento está marcado para amanhã! Confirme sua presença."

**Lembrete 3h antes:**
- **Name:** Lembrete 3h
- **Message:**
  - Título: "Seu atendimento é hoje! 💅"
  - Mensagem: "Lembre-se: seu atendimento é daqui a 3 horas. Até logo!"

**Lembrete 1h antes:**
- **Name:** Lembrete 1h
- **Message:**
  - Título: "Quase na hora! ⏰"
  - Mensagem: "Seu atendimento começa em 1 hora. Te esperamos!"

### Customizar Ícone das Notificações

1. No OneSignal, vá em **Settings** → **All Browsers**
2. Em **Default Notification Icon**, faça upload de um ícone PNG (192x192 ou 256x256)
3. Sugestão: use um ícone de unhas pintadas 💅 ou o logo do seu estúdio

### Testar Notificações

1. No OneSignal, vá em **Messages** → **New Push**
2. Clique em **New Message**
3. Preencha:
   - **Audience:** Subscribed Users
   - **Title:** Teste de Notificação
   - **Message:** Olá! Esta é uma notificação de teste.
4. Clique em **Send Message**
5. Você deve receber a notificação em segundos!

---

## ❓ Solução de Problemas

### Não vejo o botão de notificações

**Possível causa:** As credenciais não foram configuradas corretamente.

**Solução:**
1. Verifique o arquivo `.env` no servidor
2. Certifique-se de que `VITE_ONESIGNAL_APP_ID` está preenchido
3. Reinicie a aplicação: `pm2 restart manicure-studio`

### O botão aparece mas não funciona

**Possível causa:** O navegador bloqueou as notificações ou o HTTPS não está configurado.

**Solução:**
1. Certifique-se de que está usando **HTTPS** (SSL)
   - OneSignal exige HTTPS para funcionar
   - Configure o SSL usando o guia no DEPLOY.md
2. Verifique se o navegador não bloqueou notificações
   - Chrome: Configurações → Privacidade → Notificações
   - Firefox: Preferências → Privacidade → Permissões

### "OneSignal service initialization failed"

**Possível causa:** App ID ou API Key incorretos.

**Solução:**
1. Verifique se copiou as credenciais corretamente
2. No OneSignal, vá em Settings → Keys & IDs
3. Copie novamente e cole no arquivo `.env`
4. Reinicie: `pm2 restart manicure-studio`

### As notificações não são enviadas

**Possível causa:** Usuário não deu permissão ou não está inscrito.

**Solução:**
1. Verifique no OneSignal dashboard quantos usuários estão inscritos
   - Vá em **Audience** → **All Users**
   - Você deve ver pelo menos 1 usuário inscrito
2. Teste enviando uma notificação manual (veja seção "Testar Notificações")

---

## 💡 Dicas

- **Não compartilhe** suas credenciais (App ID e API Key) publicamente
- **Use HTTPS** sempre - OneSignal não funciona sem SSL
- **Teste sempre** após configurar - envie uma notificação de teste
- **Monitore** o dashboard do OneSignal para ver quantos usuários estão recebendo notificações

---

## 📊 Métricas

No dashboard do OneSignal você pode ver:

- **Total de usuários inscritos**
- **Taxa de entrega** das notificações
- **Taxa de cliques** (quantos abriram a notificação)
- **Melhores horários** para enviar notificações

Isso ajuda a melhorar a comunicação com seus clientes!

---

## 🎉 Pronto!

Agora seu app está com notificações push funcionando perfeitamente. Seus clientes receberão lembretes automáticos e você poderá enviar mensagens personalizadas quando quiser!
