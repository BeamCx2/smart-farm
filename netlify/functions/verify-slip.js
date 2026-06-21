const { createHash } = require('crypto');

function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
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

function parsePromptPayPayload(payload) {
    const tlv = parseTLV(payload);
    const amount = Number(tlv['54']?.value || 0);
    const merchantName = tlv['59']?.value || '';
    const merchantCity = tlv['60']?.value || '';
    const additional = tlv['62'] ? parseTLV(tlv['62'].value) : {};

    let account = '';
    let accountSource = null;
    const accountFields = ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35'];
    for (const field of accountFields) {
        const entry = tlv[field];
        if (!entry?.value) continue;
        const found = findAccountInTemplate(entry.value);
        if (found) {
            account = found.account;
            accountSource = { field, subId: found.subId, rawValue: found.rawValue };
            break;
        }
    }

    if (!account) {
        // fallback: top-level fields may contain numeric account identifiers
        for (const field of ['02', '03', '04', '05', '06', '07', '08', '09']) {
            const entry = tlv[field];
            if (!entry?.value) continue;
            const digits = normalizeDigits(entry.value);
            if (digits.length >= 9 && digits.length <= 13) {
                account = digits;
                accountSource = { field, rawValue: entry.value };
                break;
            }
        }
    }

    const transRef = additional['05']?.value || additional['04']?.value || additional['07']?.value || additional['08']?.value || '';
    const payloadHash = createHash('sha256').update(payload).digest('hex');

    return {
        amount,
        merchantName,
        merchantCity,
        account,
        accountSource,
        transRef,
        payload,
        payloadHash,
        rawTLV: tlv,
        additional
    };
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
        const expectedAccounts = ['0638986566', '00638989656'];
        const normalizedAccount = normalizeDigits(slip.account);
        const isAccountValid = expectedAccounts.includes(normalizedAccount);

        const response = {
            success: isAccountValid && slip.amount > 0,
            data: {
                amountInSlip: slip.amount,
                payload: slip.payload,
                payloadHash: slip.payloadHash,
                rawSlip: {
                    receiver: {
                        account: {
                            bank: {
                                account: slip.account || ''
                            },
                            name: {
                                th: slip.merchantName || ''
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

        if (!isAccountValid) {
            response.success = false;
            response.message = 'QR ไม่ตรงบัญชี PromptPay ของเรา';
            response.data.details = {
                foundAccount: slip.account,
                expectedAccounts,
                merchantName: slip.merchantName,
                merchantCity: slip.merchantCity
            };
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
