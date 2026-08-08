CREATE DATABASE IF NOT EXISTS baby_companion_shadow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON baby_companion_shadow.* TO 'baby_companion'@'%';
FLUSH PRIVILEGES;
