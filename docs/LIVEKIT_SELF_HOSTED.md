# Self-Hosted LiveKit Server Setup

This guide explains how to deploy your own LiveKit server for the Social OS live streaming feature.

## Why Self-Host?

- **No per-use fees**: Pay only for your server infrastructure
- **Full control**: Complete ownership of your streaming infrastructure
- **Privacy**: All streaming data stays on your servers
- **Scalability**: Scale on your own terms

## Deployment Options

### Option 1: Docker Compose (Recommended for Testing)

1. **Create `docker-compose.yml`:**

```yaml
version: '3.9'
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"   # HTTP
      - "7881:7881"   # HTTPS (if using TLS)
      - "50000-50100:50000-50100/udp"  # WebRTC ports
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    restart: unless-stopped
```

2. **Create `livekit.yaml`:**

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true  # Important for production
  
keys:
  # Generate these with: openssl rand -base64 32
  your-api-key: your-api-secret
  
logging:
  level: info
```

3. **Start the server:**

```bash
docker-compose up -d
```

### Option 2: Kubernetes (Production)

LiveKit provides official Helm charts:

```bash
helm repo add livekit https://helm.livekit.io
helm install livekit livekit/livekit-server \
  --set livekit.config.keys.your-api-key=your-api-secret
```

### Option 3: Bare Metal / VPS

1. **Install LiveKit:**

```bash
curl -sSL https://get.livekit.io | bash
```

2. **Configure `/etc/livekit.yaml`** (same as above)

3. **Run as systemd service:**

```bash
sudo systemctl enable livekit
sudo systemctl start livekit
```

## Server Requirements

### Minimum (Testing):
- 2 CPU cores
- 4GB RAM
- 50GB storage
- 100 Mbps network

### Production (100 concurrent users):
- 8 CPU cores
- 16GB RAM
- 200GB storage
- 1 Gbps network

### Scaling:
Each additional 100 concurrent users requires approximately:
- +4 CPU cores
- +8GB RAM
- +500 Mbps bandwidth

## Network Configuration

### Firewall Rules:

```bash
# HTTP/HTTPS
sudo ufw allow 7880/tcp
sudo ufw allow 7881/tcp

# WebRTC UDP ports
sudo ufw allow 50000:50100/udp
```

### DNS Setup:

Point your domain to the server:
```
livekit.yourdomain.com -> YOUR_SERVER_IP
```

### SSL/TLS (Required for Production):

Use Let's Encrypt with Caddy or Nginx:

**Caddy (Recommended):**
```
livekit.yourdomain.com {
    reverse_proxy localhost:7880
}
```

**Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name livekit.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Generate API Keys

```bash
# API Key (any string)
API_KEY="your-api-key"

# API Secret (secure random string)
API_SECRET=$(openssl rand -base64 32)

echo "API_KEY: $API_KEY"
echo "API_SECRET: $API_SECRET"
```

## Configure Supabase Secrets

Add these to your Supabase project:

```bash
# In Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-generated-secret
LIVEKIT_URL=wss://livekit.yourdomain.com
```

Or via CLI:
```bash
supabase secrets set LIVEKIT_API_KEY=your-api-key
supabase secrets set LIVEKIT_API_SECRET=your-generated-secret
supabase secrets set LIVEKIT_URL=wss://livekit.yourdomain.com
```

## Testing Your Setup

1. **Check server health:**
```bash
curl http://your-server:7880/
```

2. **Test from browser console:**
```javascript
const response = await fetch('https://your-supabase-url/functions/v1/generate-livekit-token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SESSION_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomName: 'test-room',
    identity: 'test-user',
    metadata: { name: 'Test User' }
  })
});
const data = await response.json();
console.log(data); // Should return { token: '...', url: 'wss://...' }
```

## Cost Estimation

### Self-Hosted (DigitalOcean/Hetzner):
- **Small** (100 users): $40-80/month
- **Medium** (500 users): $160-320/month
- **Large** (2000 users): $640-1280/month

### vs LiveKit Cloud:
- **Pay-per-use**: ~$0.01-0.02 per participant-minute
- **100 users streaming 1hr/day**: ~$1,800-3,600/month

**Self-hosting saves 95%+ at scale.**

## Monitoring

Use LiveKit's built-in metrics:

```yaml
# Add to livekit.yaml
prometheus:
  enabled: true
  port: 6789
```

Then scrape with Prometheus/Grafana.

## Troubleshooting

### "Connection failed" errors:
- Check firewall allows UDP ports 50000-50100
- Verify `use_external_ip: true` in config
- Ensure SSL certificate is valid

### "Invalid token" errors:
- Verify API keys match between LiveKit server and Supabase secrets
- Check token expiration (default 6 hours)

### Poor video quality:
- Increase server resources
- Check network bandwidth
- Reduce concurrent streams

## Production Checklist

- [ ] SSL/TLS certificate configured
- [ ] Firewall rules applied
- [ ] DNS pointing to server
- [ ] API keys rotated from defaults
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Load balancer setup (for HA)
- [ ] CDN for static assets (optional)

## Next Steps

Once your LiveKit server is running:

1. Update Supabase secrets with your server URL and keys
2. Uncomment the LiveStream code in `src/pages/LiveStreamPage.tsx`
3. Deploy to production
4. Test with real users

## Support

- LiveKit Docs: https://docs.livekit.io
- Self-Hosting Guide: https://docs.livekit.io/deploy/
- Community: https://livekit.io/community
