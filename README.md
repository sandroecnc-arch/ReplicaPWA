# Manicure Studio Lite - PWA

Sistema completo de gerenciamento para estúdios de manicure com agendamentos, clientes, programa de fidelidade e notificações push.

## 📱 Funcionalidades

- ✅ **Gestão de Agendamentos** - Calendário visual com agendamentos por dia/semana
- ✅ **Gestão de Clientes** - Cadastro completo com histórico de atendimentos
- ✅ **Programa de Fidelidade** - Sistema automático de pontos (10 pontos por serviço concluído)
- ✅ **Relatórios e Estatísticas** - Gráficos de faturamento, serviços populares e status
- ✅ **Notificações Push** - Lembretes automáticos via OneSignal
- ✅ **Tema Claro/Escuro** - Personalização visual salva automaticamente
- ✅ **Progressive Web App** - Funciona como app nativo no celular

## 🏗️ Tecnologias

### Frontend
- React 18 com Vite
- TypeScript
- Tailwind CSS + Shadcn UI
- React Query (TanStack Query)
- Recharts (gráficos)
- Wouter (roteamento)

### Backend
- Node.js + Express.js
- SQLite (better-sqlite3)
- OneSignal SDK
- Node-cron (tarefas agendadas)
- Zod (validação)

## 📦 Estrutura do Projeto

```
/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
│   └── index.html
├── server/              # Backend Express
│   ├── index.ts         # Servidor principal
│   ├── routes.ts        # Rotas da API
│   ├── database.ts      # Configuração SQLite
│   ├── onesignal-service.ts  # Integração OneSignal
│   └── cron-jobs.ts     # Jobs agendados
├── shared/              # Schemas compartilhados
│   └── schema.ts        # Modelos TypeScript/Zod
├── dist/                # Build de produção (gerado)
└── db.sqlite            # Banco de dados (gerado)
```

## 🚀 Deploy no VPS (Ubuntu/Debian)

### Pré-requisitos

Você precisará de um servidor VPS com Ubuntu 20.04+ ou Debian 10+. Este guia assume que você tem acesso SSH root ou sudo.

### 1. Preparação do Servidor

Conecte-se ao seu VPS via SSH:

```bash
ssh root@seu-servidor-ip
```

Atualize o sistema e instale dependências:

```bash
# Atualizar pacotes
apt update && apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Nginx
apt install -y nginx

# Verificar instalações
node --version  # deve mostrar v20.x.x
npm --version
pm2 --version
nginx -v
```

### 2. Configuração do Projeto

Criar diretório para a aplicação:

```bash
# Criar diretório
mkdir -p /var/www/manicure-studio
cd /var/www/manicure-studio

# Clonar ou enviar o código
# Opção 1: Upload via SCP (do seu computador local)
# scp -r ./dist root@seu-servidor-ip:/var/www/manicure-studio/

# Opção 2: Git clone (se estiver em repositório)
# git clone https://seu-repositorio.git .
# npm run build  # executar build se clonou código fonte
```

### 3. Build da Aplicação

Se você enviou o código-fonte completo (não apenas a pasta dist):

```bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Isso criará a pasta dist/ com:
# - dist/index.js (servidor backend)
# - dist/public/ (arquivos estáticos do frontend)
# - dist/ecosystem.config.cjs (configuração PM2)
# - dist/package.json
```

### 4. Configurar Variáveis de Ambiente

Criar arquivo de environment para OneSignal:

```bash
# Criar arquivo .env no diretório dist
cd /var/www/manicure-studio/dist

cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
ONESIGNAL_APP_ID=seu-onesignal-app-id
ONESIGNAL_API_KEY=sua-onesignal-api-key
EOF
```

**Importante:** Substitua `seu-onesignal-app-id` e `sua-onesignal-api-key` pelos valores reais do OneSignal (veja seção "Configuração do OneSignal" abaixo).

### 5. Instalar Dependências de Produção

```bash
cd /var/www/manicure-studio/dist
npm install --production
```

### 6. Configurar Nginx

Criar configuração do Nginx como proxy reverso:

```bash
nano /etc/nginx/sites-available/manicure-studio
```

Cole a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;  # Altere para seu domínio
    
    # Logs
    access_log /var/log/nginx/manicure-studio-access.log;
    error_log /var/log/nginx/manicure-studio-error.log;

    # Aumentar tamanho máximo de upload
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Ativar o site e reiniciar Nginx:

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/manicure-studio /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Habilitar para iniciar com o sistema
systemctl enable nginx
```

### 7. Iniciar a Aplicação com PM2

```bash
cd /var/www/manicure-studio/dist

# Iniciar aplicação
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
pm2 startup systemd
# Execute o comando que o PM2 mostrar (começa com 'sudo env PATH=...')

# Verificar status
pm2 status
pm2 logs manicure-studio
```

### 8. Configurar SSL (HTTPS) com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# O Certbot configurará automaticamente o Nginx para HTTPS
# Certificados serão renovados automaticamente
```

### 9. Firewall (Opcional mas Recomendado)

```bash
# Configurar UFW
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
ufw status
```

## 🔔 Configuração do OneSignal

### 1. Criar Conta no OneSignal

1. Acesse [https://onesignal.com](https://onesignal.com)
2. Crie uma conta gratuita
3. Clique em "New App/Website"
4. Selecione "Web Push" como plataforma
5. Configure o nome do app e URL do site

### 2. Obter Credenciais

No dashboard do OneSignal:

1. Vá em **Settings > Keys & IDs**
2. Copie o **OneSignal App ID**
3. Copie a **REST API Key**
4. Adicione estes valores no arquivo `.env` do servidor (passo 4 do deploy)

### 3. Configurar Site Settings

1. Vá em **Settings > All Browsers**
2. Configure:
   - **Site Name:** Manicure Studio Lite
   - **Site URL:** https://seu-dominio.com
   - **Auto Resubscribe:** ON
   - **Default Notification Icon:** Upload um ícone PNG

### 4. Configurar Automações de Lembrete

Para lembretes automáticos de agendamento (24h, 3h, 1h antes):

1. Vá em **Messages > Automated**
2. Clique em **New Automated Message**
3. Configure cada lembrete:

**Lembrete 24h antes:**
- **Trigger:** Data Tag Changes
- **Tag Key:** `appointment_*` (usar wildcard)
- **Send Time:** 24 hours before tag datetime
- **Title:** "Lembrete de Agendamento 📅"
- **Message:** "Seu atendimento está marcado para amanhã às {{tag_value}}. Confirme sua presença!"

**Lembrete 3h antes:**
- **Trigger:** Data Tag Changes
- **Tag Key:** `appointment_*`
- **Send Time:** 3 hours before tag datetime
- **Title:** "Seu atendimento é hoje! 💅"
- **Message:** "Lembre-se: seu atendimento é daqui a 3 horas. Até logo!"

**Lembrete 1h antes:**
- **Trigger:** Data Tag Changes
- **Tag Key:** `appointment_*`
- **Send Time:** 1 hour before tag datetime
- **Title:** "Quase na hora! ⏰"
- **Message:** "Seu atendimento começa em 1 hora. Te esperamos!"

### 5. Integração com o Site

O código frontend já está preparado. Adicione o seguinte snippet no arquivo `client/index.html` dentro da tag `<head>`:

```html
<script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" defer></script>
<script>
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "SEU-ONESIGNAL-APP-ID", // Substitua pelo seu App ID
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true,
      },
      welcomeNotification: {
        title: "Bem-vindo ao Manicure Studio Lite!",
        message: "Você receberá notificações sobre seus agendamentos."
      }
    });
  });
</script>
```

## 🔧 Comandos Úteis

### Gerenciamento da Aplicação

```bash
# Ver logs em tempo real
pm2 logs manicure-studio

# Reiniciar aplicação
pm2 restart manicure-studio

# Parar aplicação
pm2 stop manicure-studio

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit
```

### Atualização da Aplicação

```bash
cd /var/www/manicure-studio

# Parar aplicação
pm2 stop manicure-studio

# Fazer backup do banco de dados
cp dist/db.sqlite dist/db.sqlite.backup

# Atualizar código (git pull ou upload novo dist/)
# ...

# Reinstalar dependências se necessário
cd dist && npm install --production

# Reiniciar aplicação
pm2 restart manicure-studio

# Verificar logs
pm2 logs manicure-studio --lines 50
```

### Backup do Banco de Dados

```bash
# Backup manual
cp /var/www/manicure-studio/dist/db.sqlite /backups/db-$(date +%Y%m%d).sqlite

# Configurar backup automático diário (cron)
crontab -e

# Adicione esta linha para backup diário às 3h da manhã:
0 3 * * * cp /var/www/manicure-studio/dist/db.sqlite /backups/db-$(date +\%Y\%m\%d).sqlite
```

## 📊 Sistema de Fidelidade

O sistema de fidelidade funciona automaticamente:

1. Quando um agendamento é marcado como **"Concluído"** (status `done`)
2. O sistema adiciona **10 pontos** automaticamente ao cliente
3. Os pontos são visíveis na ficha do cliente
4. Não é necessária configuração adicional

## 🔄 Notificações Automáticas

### Lembretes de Agendamento

Quando um agendamento é criado ou editado:
- Uma **tag de data** é adicionada no OneSignal
- As automações configuradas enviam lembretes 24h, 3h e 1h antes
- Quando o agendamento é concluído ou cancelado, a tag é removida

### Clientes Inativos

O sistema executa automaticamente **todos os dias às 10h**:
- Verifica clientes sem agendamentos concluídos nos últimos 30 dias
- Envia notificação de reengajamento
- Logs são salvos no PM2 (`pm2 logs manicure-studio`)

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# A aplicação estará em http://localhost:5000
```

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `NODE_ENV` | Ambiente de execução | `development` | Não |
| `PORT` | Porta do servidor | `5000` | Não |
| `ONESIGNAL_APP_ID` | ID do app OneSignal | - | Sim (para notificações) |
| `ONESIGNAL_API_KEY` | Chave da API OneSignal | - | Sim (para notificações) |

## 🆘 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs manicure-studio --err

# Verificar processo
pm2 status

# Reiniciar
pm2 restart manicure-studio
```

### Erro 502 Bad Gateway (Nginx)

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar configuração do Nginx
nginx -t

# Verificar logs do Nginx
tail -f /var/log/nginx/manicure-studio-error.log
```

### Banco de dados corrompido

```bash
# Restaurar do backup
cp /backups/db-20250101.sqlite /var/www/manicure-studio/dist/db.sqlite

# Reiniciar aplicação
pm2 restart manicure-studio
```

### Notificações não funcionam

1. Verificar se `ONESIGNAL_APP_ID` e `ONESIGNAL_API_KEY` estão configurados
2. Verificar logs: `pm2 logs manicure-studio | grep OneSignal`
3. Testar no dashboard do OneSignal enviando notificação manual
4. Verificar se o domínio está correto nas configurações do OneSignal

## 📄 Licença

MIT

## 👥 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `pm2 logs manicure-studio`
2. Consulte a documentação do OneSignal: [https://documentation.onesignal.com](https://documentation.onesignal.com)
3. Verifique os logs do Nginx: `/var/log/nginx/`

---

**Desenvolvido com ❤️ para profissionais de beleza**
