import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_crKa0uZYB6Dp@ep-solitary-brook-a16swhh1-pooler.ap-southeast-1.aws.neon.tech/xianyu?sslmode=require&channel_binding=require';

const baseSql = neon(DATABASE_URL);

function formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())} ${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;
}

function convertDateFields<T>(data: T): T {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) {
        return data.map((item) => convertDateFields(item)) as unknown as T;
    }
    if (typeof data !== 'object') return data;
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
            result[key] = formatDateTimeLocal(value);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = convertDateFields(value);
        } else {
            result[key] = value;
        }
    }
    return result as unknown as T;
}

export function sql<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
    const result = baseSql(strings, ...values);
    
    if (result?.then) {
        return result.then((data) => {
            if (Array.isArray(data)) return convertDateFields(data);
            if (data && typeof data === 'object' && 'rows' in data) {
                return convertDateFields((data as { rows: unknown[] }).rows);
            }
            return convertDateFields(data);
        }) as unknown as Promise<T>;
    }
    return result as unknown as Promise<T>;
}