import * as fs from 'fs';
import * as path from 'path';

interface Config {
  NODE_ENV: string;
  DATABASE_URL: string;
  API_SECRET_KEY: string;
  // Add other configuration variables as needed
}

const defaultConfig: Config = {
  NODE_ENV: 'development',
  DATABASE_URL: 'sqlite://./data/pos_database.sqlite',
  API_SECRET_KEY: 'default_secret_key',
  // Set default values for other variables
};

function loadConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.join(__dirname, `${env}.json`);

  let config = { ...defaultConfig };

  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config = { ...config, ...fileConfig };
  }

  // Override with environment variables if they exist
  Object.keys(config).forEach((key) => {
    if (process.env[key]) {
      (config as any)[key] = process.env[key];
    }
  });

  return config;
}

const config: Config = loadConfig();

export default config;
