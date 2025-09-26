# Jump to Recipe - Scripts

This directory contains deployment and management scripts for the Jump to Recipe application.

## Deployment Scripts

- `deploy-to-pi.sh` - Initial Raspberry Pi deployment setup
- `setup-app.sh` - Application configuration and setup
- `setup-database.sh` - Database initialization and migration
- `start-app.sh` - Start the application using PM2
- `stop-app.sh` - Stop the running application
- `update-app.sh` - Update application with new code

## Usage

Make scripts executable before running:
```bash
chmod +x scripts/*.sh
```

Run deployment in order:
1. `./scripts/deploy-to-pi.sh`
2. `./scripts/setup-app.sh` 
3. `./scripts/setup-database.sh`
4. `./scripts/start-app.sh`

## Management

- Start: `./scripts/start-app.sh`
- Stop: `./scripts/stop-app.sh`
- Update: `./scripts/update-app.sh`