# Environment Variables Configuration

Copy these variables to your `.env` file and configure them according to your environment.

## Server Configuration

```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
```

## Database Configuration

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cdn_control
```

## Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## JWT Configuration

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Important Notes

1. **Never commit `.env` file to version control**
2. **Change JWT_SECRET in production** - Use a strong random string
3. **Database credentials** - Ensure MySQL 8.0+ is installed and running
4. **Redis** - Optional for now, but required for DNS worker queue in production
