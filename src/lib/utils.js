export function formatTHB(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function toSatang(baht) {
    return Math.round(baht * 100);
}

export function fromSatang(satang) {
    return satang / 100;
}

export function generateOrderId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SF-${ts}-${rand}`;
}

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function truncate(str, len = 80) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

export function formatDate(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatDateTime(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const CATEGORIES = [
    'ผักสด',
    'ต้นกล้า',
    // 'นม & ผลิตภัณฑ์นม',
    'ปุ๋ย',
    'อุปกรณ์การปลูก',
    // 'เนื้อสัตว์',
    // 'ไข่',
    // 'น้ำผึ้ง',
    'อื่นๆ',
];

export const ORDER_STATUSES = {
    pending: { label: 'รอดำเนินการ', color: 'yellow' },
    paid: { label: 'ชำระแล้ว', color: 'blue' },
    shipped: { label: 'จัดส่งแล้ว', color: 'purple' },
    completed: { label: 'เสร็จสิ้น', color: 'green' },
    cancelled: { label: 'ยกเลิก', color: 'red' },
};
