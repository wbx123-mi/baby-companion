export interface MariaDbConnectionOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  allowPublicKeyRetrieval: boolean;
}

export function parseMariaDbUrl(databaseUrl: string): MariaDbConnectionOptions {
  const url = new URL(databaseUrl);
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql protocol");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !url.username || !database) {
    throw new Error("DATABASE_URL must include host, username and database");
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 5,
    // MySQL 8 defaults to caching_sha2_password. The database is only exposed
    // on the private Docker network, so the driver may retrieve its RSA key.
    allowPublicKeyRetrieval: true,
  };
}
