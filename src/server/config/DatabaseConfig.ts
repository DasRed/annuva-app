export default interface DatabaseConfig {
    database: string;
    driver: 'sqlite' | 'mysql' | 'postgres';
    host: string;
    password: string;
    port: number;
    sqliteFile: string;
    url: string | null;
    user: string;
}
