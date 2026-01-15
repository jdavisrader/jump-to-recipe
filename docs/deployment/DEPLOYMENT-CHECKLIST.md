# Docker Deployment Checklist

Use this checklist to ensure a smooth deployment of Jump to Recipe on your Ubuntu server.

## Pre-Deployment

### Server Setup
- [ ] Ubuntu Server 20.04+ installed
- [ ] SSH access configured
- [ ] At least 2GB RAM available
- [ ] At least 10GB disk space available
- [ ] Firewall configured (if applicable)

### Docker Installation
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker compose version`)
- [ ] User added to docker group (`docker ps` works without sudo)

### Project Files
- [ ] Project files transferred to server
- [ ] All scripts are executable (`chmod +x scripts/*.sh`)
- [ ] `.env.example` file exists

## Configuration

### Environment Variables
- [ ] `.env` file created from `.env.example`
- [ ] `DB_PASSWORD` set to secure password
- [ ] `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` set to your server URL
- [ ] OAuth credentials configured (if using)
- [ ] `DATABASE_URL` uses `db` as hostname (not `localhost`)

### Optional Configuration
- [ ] Domain name configured (if using)
- [ ] SSL certificates obtained (if using HTTPS)
- [ ] Nginx configuration updated (if using reverse proxy)

## Deployment

### Initial Deployment
- [ ] Run `./scripts/docker-deploy.sh`
- [ ] Wait for containers to start
- [ ] Check container status (`docker compose ps`)
- [ ] Verify all containers are healthy

### Verification
- [ ] Application accessible at `http://localhost:3000`
- [ ] Application accessible from network
- [ ] Health check endpoint works (`curl http://localhost:3000/api/health`)
- [ ] Database connection successful
- [ ] Can create test user account
- [ ] Can create test recipe

### Logs Check
- [ ] Application logs show no errors (`docker compose logs app`)
- [ ] Database logs show no errors (`docker compose logs db`)
- [ ] No container restarts (`docker compose ps`)

## Post-Deployment

### Backups
- [ ] Test backup script (`./scripts/docker-backup.sh`)
- [ ] Verify backup files created in `./backups/`
- [ ] Test restore process
- [ ] Set up automated backups (cron)

### Monitoring
- [ ] Container health checks working
- [ ] Resource usage acceptable (`docker stats`)
- [ ] Disk space monitored
- [ ] Log rotation configured (if needed)

### Security
- [ ] Firewall rules configured
  - [ ] Port 22 (SSH) allowed
  - [ ] Port 80 (HTTP) allowed (if using)
  - [ ] Port 443 (HTTPS) allowed (if using)
  - [ ] Port 3000 allowed (if not using Nginx)
- [ ] Strong passwords set
- [ ] OAuth configured (recommended)
- [ ] SSL/TLS enabled (for production)

### Production Setup (Optional)
- [ ] Nginx reverse proxy enabled
- [ ] SSL certificates installed
- [ ] Domain name configured
- [ ] Rate limiting tested
- [ ] HTTPS redirect enabled

## Maintenance

### Regular Tasks
- [ ] Backup schedule configured (daily recommended)
- [ ] Backup retention policy set (30 days recommended)
- [ ] Update schedule planned (weekly/monthly)
- [ ] Monitoring alerts configured

### Documentation
- [ ] Server access details documented
- [ ] Environment variables documented
- [ ] Backup/restore procedures documented
- [ ] Team members trained

## Troubleshooting Commands

Keep these handy:

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f app
docker compose logs -f db

# Restart services
docker compose restart

# Check resources
docker stats

# Check disk space
docker system df

# Access database
docker compose exec db psql -U jumptorecipe jump_to_recipe

# Execute commands in app
docker compose exec app sh
```

## Rollback Plan

If something goes wrong:

- [ ] Backup files available
- [ ] Previous version documented
- [ ] Rollback procedure tested
- [ ] Database backup recent

## Success Criteria

Deployment is successful when:

- ✅ All containers running and healthy
- ✅ Application accessible from browser
- ✅ Users can register and login
- ✅ Recipes can be created and viewed
- ✅ Database persists data across restarts
- ✅ Backups working correctly
- ✅ No errors in logs
- ✅ Performance acceptable

## Next Steps After Deployment

1. **Test thoroughly**
   - Create test accounts
   - Import test recipes
   - Test all major features

2. **Set up monitoring**
   - Configure uptime monitoring
   - Set up log aggregation
   - Configure alerts

3. **Document**
   - Update team documentation
   - Document any custom configurations
   - Share access details securely

4. **Plan maintenance**
   - Schedule regular updates
   - Plan backup testing
   - Schedule security reviews

## Support Resources

- **Full Documentation**: `docs/deployment/README-DEPLOYMENT.md`
- **Quick Reference**: `docs/deployment/DOCKER-QUICK-START.md`
- **Migration Guide**: `docs/deployment/MIGRATION-TO-DOCKER.md`
- **Scripts Documentation**: `scripts/README.md`

---

**Ready to deploy?** Start with the Pre-Deployment section and work your way down! ✅
