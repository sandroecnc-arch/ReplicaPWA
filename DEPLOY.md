# Guia de Deploy - Manicure Studio Lite

Este guia vai te ajudar a fazer o deploy da aplicação em um servidor VPS da Hostinger (ou qualquer outro VPS com Ubuntu/Debian).

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04 ou superior
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)

---

## 🚀 Passo a Passo

### 1. Preparar o Projeto Localmente

No Replit, execute o comando de build:

```bash
npm run build
```

Isso irá criar a pasta `dist/` com os arquivos compilados.

### 2. Conectar ao Servidor VPS

Abra um terminal no seu computador e conecte-se ao servidor:

```bash
ssh root@seu-ip-do-servidor
```

Ou se você tiver um usuário específico:

```bash
ssh seu-usuario@seu-ip-do-servidor
```

### 3. Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 4. Instalar Node.js e NPM

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 5. Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2
```

### 6. Instalar e Configurar Nginx

```bash
sudo apt install -y nginx

# Verificar se está rodando
sudo systemctl status nginx
```

### 7. Criar Diretório para a Aplicação

```bash
# Criar pasta do projeto
sudo mkdir -p /var/www/manicure-studio
cd /var/www/manicure-studio

# Dar permissões ao seu usuário
sudo chown -R $USER:$USER /var/www/manicure-studio
```

### 8. Transferir Arquivos do Projeto

**Opção A: Usando Git (Recomendado)**

Se seu projeto está no GitHub/GitLab:

```bash
cd /var/www/manicure-studio
git clone https://seu-repositorio.git .
npm install --production
```

**Opção B: Usando SCP (do seu computador local)**

No seu computador (não no servidor), na pasta do projeto:

```bash
# Fazer download do projeto do Replit primeiro
# Depois enviar para o servidor:
scp -r * seu-usuario@seu-ip:/var/www/manicure-studio/
```

Depois no servidor:

```bash
cd /var/www/manicure-studio
npm install --production
```

**Opção C: Usando SFTP**

Use um cliente SFTP como FileZilla para transferir os arquivos.

### 9. Configurar Variáveis de Ambiente

```bash
cd /var/www/manicure-studio
nano .env
```

Cole o seguinte conteúdo (ajuste conforme necessário):

```env
NODE_ENV=production
PORT=5000

# OneSignal Backend (Opcional - Para enviar notificações do servidor)
ONESIGNAL_APP_ID=seu-onesignal-app-id
ONESIGNAL_API_KEY=sua-onesignal-api-key

# OneSignal Frontend (Opcional - Para botão de ativar notificações)
# Use o mesmo App ID do backend
VITE_ONESIGNAL_APP_ID=seu-onesignal-app-id
```

**Importante sobre OneSignal:**
- Se você NÃO quiser usar notificações push, pode deixar todos os campos vazios
- Se você QUISER usar notificações:
  - Configure `ONESIGNAL_APP_ID` e `ONESIGNAL_API_KEY` (para o backend)
  - Configure `VITE_ONESIGNAL_APP_ID` com o mesmo App ID (para o botão de notificações no app)
  - Veja a seção "Configurar OneSignal" abaixo para obter essas credenciais

Salve com `Ctrl+O`, Enter, e saia com `Ctrl+X`.

### 10. Criar Pasta de Logs

```bash
mkdir -p /var/www/manicure-studio/logs
```

### 11. Iniciar a Aplicação com PM2

```bash
cd /var/www/manicure-studio
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

O último comando vai te mostrar um comando para executar. Copie e execute ele.

### 12. Verificar se está Rodando

```bash
pm2 status
pm2 logs manicure-studio
```

Você deve ver a aplicação rodando e os logs mostrando que está servindo na porta 5000.

### 13. Configurar Nginx como Proxy Reverso

```bash
sudo nano /etc/nginx/sites-available/manicure-studio
```

Cole o seguinte conteúdo (substitua `seudominio.com` pelo seu domínio):

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    access_log /var/log/nginx/manicure-studio-access.log;
    error_log /var/log/nginx/manicure-studio-error.log;

    client_max_body_size 10M;

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
    }
}
```

Salve e saia (`Ctrl+O`, Enter, `Ctrl+X`).

### 14. Ativar o Site no Nginx

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/manicure-studio /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 15. Configurar Firewall

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 16. Configurar SSL/HTTPS com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

Siga as instruções na tela. O Certbot vai configurar tudo automaticamente.

### 17. Configurar Renovação Automática do SSL

```bash
# Testar renovação
sudo certbot renew --dry-run
```

O certbot já configura a renovação automática. Você não precisa fazer nada.

---

## ✅ Verificar se Está Funcionando

1. Abra o navegador e acesse: `http://seudominio.com` ou `http://seu-ip`
2. Você deve ver a aplicação rodando!

---

## 🔧 Comandos Úteis

### Gerenciar a Aplicação com PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs manicure-studio

# Reiniciar aplicação
pm2 restart manicure-studio

# Parar aplicação
pm2 stop manicure-studio

# Remover do PM2
pm2 delete manicure-studio
```

### Gerenciar Nginx

```bash
# Verificar status
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Recarregar configuração (sem derrubar)
sudo systemctl reload nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/manicure-studio-error.log
```

### Ver Logs da Aplicação

```bash
# Logs do PM2
pm2 logs manicure-studio

# Logs salvos
tail -f /var/www/manicure-studio/logs/out.log
tail -f /var/www/manicure-studio/logs/err.log
```

---

## 🔄 Atualizar a Aplicação

Quando você fizer alterações e quiser atualizar:

**Se estiver usando Git:**

```bash
cd /var/www/manicure-studio
git pull
npm install --production
npm run build
pm2 restart manicure-studio
```

**Se estiver usando SCP/SFTP:**

1. Faça upload dos novos arquivos
2. No servidor:

```bash
cd /var/www/manicure-studio
npm install --production
npm run build
pm2 restart manicure-studio
```

---

## 📱 Configurar Notificações Push (Opcional)

Se você quiser usar notificações push:

1. Crie uma conta em https://onesignal.com
2. Crie um novo app no OneSignal
3. Copie o `App ID` e `API Key`
4. Adicione ao arquivo `.env`:

```env
ONESIGNAL_APP_ID=seu-app-id-aqui
ONESIGNAL_API_KEY=sua-api-key-aqui
```

5. Reinicie a aplicação:

```bash
pm2 restart manicure-studio
```

---

## 🛠️ Solução de Problemas

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs manicure-studio --lines 100

# Verificar se a porta 5000 está livre
sudo netstat -tulpn | grep 5000
```

### Nginx mostra erro 502 Bad Gateway

- Verifique se a aplicação está rodando: `pm2 status`
- Verifique os logs: `pm2 logs manicure-studio`
- Reinicie a aplicação: `pm2 restart manicure-studio`

### Não consigo acessar pelo domínio

- Verifique se o domínio está apontando para o IP do servidor
- Verifique a configuração do Nginx: `sudo nginx -t`
- Verifique o firewall: `sudo ufw status`

### Database não funciona

- O arquivo `db.sqlite` será criado automaticamente na primeira execução
- Certifique-se de que a pasta tem permissões de escrita:

```bash
sudo chown -R $USER:$USER /var/www/manicure-studio
chmod -R 755 /var/www/manicure-studio
```

---

## 📊 Monitoramento

### Ver uso de recursos

```bash
# CPU e memória
pm2 monit

# Informações detalhadas
pm2 show manicure-studio
```

---

## 🔐 Segurança Adicional

### Criar usuário não-root

```bash
# Criar usuário
sudo adduser manicure

# Adicionar ao grupo sudo
sudo usermod -aG sudo manicure

# Trocar dono dos arquivos
sudo chown -R manicure:manicure /var/www/manicure-studio

# Usar esse usuário no PM2
pm2 restart manicure-studio --uid manicure --gid manicure
```

### Configurar backup automático

```bash
# Criar script de backup
nano ~/backup.sh
```

Cole:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/seu-usuario/backups"
mkdir -p $BACKUP_DIR
cp /var/www/manicure-studio/db.sqlite $BACKUP_DIR/db_$DATE.sqlite
# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/db_*.sqlite | tail -n +8 | xargs rm -f
```

Salve e dê permissão:

```bash
chmod +x ~/backup.sh

# Adicionar ao crontab (rodar todo dia às 3h)
crontab -e
```

Adicione:

```
0 3 * * * /home/seu-usuario/backup.sh
```

---

## 🎉 Pronto!

Sua aplicação está rodando em produção! 

- **URL**: http://seudominio.com (ou https:// se configurou SSL)
- **Banco de Dados**: SQLite em `/var/www/manicure-studio/db.sqlite`
- **Logs**: `/var/www/manicure-studio/logs/`

Para qualquer dúvida, consulte os logs ou entre em contato com suporte técnico.
