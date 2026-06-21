const { createHash } = require('crypto');

function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function normalizeAccount(value) {
    let digits = normalizeDigits(value);
    
    // จัดการรหัสประเทศของ PromptPay ที่อาจแนบมาในรูปแบบ 0066 หรือ 66
    if (digits.startsWith('0066')) {
        digits = digits.slice(4);
    } else if (digits.startsWith('66')) {
        digits = digits.slice(2);
    }
    
    // ตัด 0 นำหน้าออกเพื่อให้เหลือแค่ตัวเลขหลักของเบอร์โทรหรือบัญชี
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }
    
    return digits;
}

function parseTLV(payload) {
    const result = {};
    let index = 0;
    while (index + 4 <= payload.length) {
        const id = payload.slice(index, index + 2);
        const length = Number(payload.slice(index + 2, index + 4));
        const value = payload.slice(index + 4, index + 4 + length);
        if (!id || Number.isNaN(length) || value.length !== length) break;
        result[id] = { value, length };
        index += 4 + length;
    }
    return result;
}

function findAccountInTemplate(template) {
    const nested = parseTLV(template);
    for (const subId of Object.keys(nested)) {
        const value = nested[subId].value;
        const digits = normalizeDigits(value);
        if (digits.length >= 9 && digits.length <= 13) {
            return { account: digits, subId, rawValue: value };
        }
    }
    return null;
}

function parsePromptPayUrl(payload) {
    try {
        const url = new URL(payload);
        const path = url.pathname.replace(/^\//, '');
        const parts = path.split('/').filter(Boolean);
        let account = '';
        let amount = 0;

        if (parts.length >= 1) {
            account = normalizeDigits(parts[0]);
        }
        if (parts.length >= 2) {
            amount = Number(parts[1]) || 0;
        }
        if (!amount) {
            amount = Number(url.searchParams.get('amount')) || 0;
        }

        return {
            account,
            amount,
            merchantName: '',
            merchantCity: '',
            transRef: url.searchParams.get('ref') || '',
            payloadHash: createHash('sha256').update(payload).digest('hex'),
            payload,
            rawTLV: {},
            additional: {}
        };
    } catch (error) {
        return null;
    }
}

function parsePromptPayPayload(payload) {
    const tlv = parseTLV(payload);
    const amount = Number(tlv['54']?.value || 0);
    const merchantName = tlv['59']?.value || '';
    const merchantCity = tlv['60']?.value || '';
    const additional = tlv['62'] ? parseTLV(tlv['62'].value) : {};

    let account = '';
    const accountFields = ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35'];
    for (const field of accountFields) {
        const entry = tlv[field];
        if (!entry?.value) continue;
        const found = findAccountInTemplate(entry.value);
        if (found) {
            account = found.account;
            break;
        }
    }

    if (!account) {
        for (const field of ['02', '03', '04', '05', '06', '07', '08', '09']) {
            const entry = tlv[field];
            if (!entry?.value) continue;
            const digits = normalizeDigits(entry.value);
            if (digits.length >= 9 && digits.length <= 13) {
                account = digits;
                break;
            }
        }
    }

    const hasTlvData = Object.keys(tlv).length > 0;
    if (!hasTlvData) {
        const urlParsed = parsePromptPayUrl(payload);
        if (urlParsed) {
            return urlParsed;
        }
    }

    const transRef = additional['05']?.value || additional['04']?.value || additional['07']?.value || additional['08']?.value || '';
    const payloadHash = createHash('sha256').update(payload).digest('hex');

    return {
        amount,
        merchantName,
        merchantCity,
        account,
        transRef,
        payload,
        payloadHash,
        rawTLV: tlv,
        additional
    };
}

function isValidPromptPayAccount(account) {
    const normalized = normalizeAccount(account);
    // เมื่อผ่านฟังก์ชัน normalizeAccount เลข 0 ด้านหน้าจะถูกตัดออก
    // 06389886566 -> 6389886566 (กสิกร)
    // 0822024218 -> 822024218 (พร้อมเพย์)
    const validAccounts = ['6389886566', '822024218'];
    
    return validAccounts.some(acc => normalized.endsWith(acc));
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

    try {
        const body = JSON.parse(event.body || '{}');
        const payload = body.payload;
        if (!payload || typeof payload !== 'string') {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing QR payload' }) };
        }

        const slip = parsePromptPayPayload(payload);
        const validAccount = isValidPromptPayAccount(slip.account);
        const validAmount = Number(slip.amount) > 0;

        const response = {
            success: validAccount && validAmount,
            data: {
                amountInSlip: slip.amount,
                receiverName: slip.merchantName,
                receiverAccount: slip.account,
                transRef: slip.transRef || slip.payloadHash,
                payloadHash: slip.payloadHash,
                rawSlip: {
                    receiver: {
                        account: {
                            bank: {
                                account: slip.account || '06389886566 / 0822024218'
                            },
                            name: {
                                th: slip.merchantName || 'ณัฐวุฒิ ภักดีอำนาจ'
                            }
                        }
                    },
                    transRef: slip.transRef || slip.payloadHash,
                    amount: {
                        amount: slip.amount
                    }
                }
            }
        };

        if (!validAccount) {
            response.success = false;
            response.message = 'QR ไม่ตรงบัญชีที่กำหนด (กสิกร หรือ พร้อมเพย์ของเรา)';
            response.data.details = {
                foundAccount: slip.account,
                expectedAccounts: ['06389886566', '0822024218'],
                merchantName: slip.merchantName,
                merchantCity: slip.merchantCity
            };
        }

        if (!validAmount) {
            response.success = false;
            response.message = 'ยอดเงินใน QR ไม่ถูกต้อง หรือไม่มีการระบุยอดเงิน';
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Verification error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Server error', error: error.message })
        };
    }
};