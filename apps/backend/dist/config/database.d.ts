import { Pool } from 'pg';
import * as schema from '../db/schema';
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export declare function connectDB(): Promise<void>;
//# sourceMappingURL=database.d.ts.map