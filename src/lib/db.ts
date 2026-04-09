import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_crKa0uZYB6Dp@ep-solitary-brook-a16swhh1-pooler.ap-southeast-1.aws.neon.tech/xianyu?sslmode=require&channel_binding=require';

const baseSql = neon(DATABASE_URL);

function formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())} ${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;
}

function convertDateFields(data: any): any {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) return data.map(convertDateFields);
    if (typeof data !== 'object') return data;
    
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
            result[key] = formatDateTimeLocal(value);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = convertDateFields(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
    const result = baseSql(strings, ...values);
    
    if (result?.then) {
        return result.then((data: any) => {
            if (Array.isArray(data)) return convertDateFields(data);
            if (data?.rows) return convertDateFields(data.rows);
            return convertDateFields(data);
        });
    }
    return result;
};