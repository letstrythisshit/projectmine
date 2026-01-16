# Factory Flow Setup

## Database setup (MySQL with XAMPP or local MySQL)

1. Start MySQL in XAMPP (or your local MySQL service).
2. Create a database and a user (optional) in phpMyAdmin or MySQL shell:
   - Database name: `factory_flow`
   - User: `factory_flow_user`
   - Password: `your_password`
3. Grant privileges to the user for the `factory_flow` database.

## API server configuration

1. Copy the environment variables below and adjust to your MySQL settings:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=factory_flow_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=factory_flow
PORT=4000
```

2. Start the API server:

```
npm run server
```

The server will create the required tables and seed the default admin account if it does not exist.

## Frontend configuration

1. Create a `.env` file in the project root with the API URL:

```
VITE_API_URL=http://localhost:4000
```

2. Start the frontend:

```
npm run dev
```

## Hosting

- Build the frontend with `npm run build` and deploy the `dist` folder to your hosting provider.
- Run the API server (`npm run server`) on a server that can reach your MySQL instance.
- Set `VITE_API_URL` to the public API server URL for production builds.
