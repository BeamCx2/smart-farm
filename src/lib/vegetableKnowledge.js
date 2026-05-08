// ฐานข้อมูลความรู้เกี่ยวกับผักสำหรับ AI ChatBot
export const VEGETABLE_KNOWLEDGE = {
    // ผักใบเขียว
    'ผักกาด': {
        thaiName: 'ผักกาด',
        scientificName: 'Brassica rapa',
        nutrition: {
            vitamins: ['A', 'C', 'K', 'B6'],
            minerals: ['แคลเซียม', 'แมกนีเซียม', 'โพแทสเซียม', 'ธาตุเหล็ก'],
            calories: 15,
            fiber: 'สูง'
        },
        benefits: [
            'บำรุงสายตาและผิวพรรณ',
            'ช่วยบำรุงกระดูกและฟัน',
            'ป้องกันโรคโลหิตจาง',
            'ช่วยลดความเสี่ยงมะเร็ง'
        ],
        cooking: [
            'กินสดในสลัด',
            'แกงจืด',
            'ผัดน้ำมันหอย',
            'ต้มยำ'
        ],
        storage: 'เก็บในตู้เย็นได้ 3-5 วัน',
        season: 'ปลูกได้ตลอดปี'
    },

    'คะน้า': {
        thaiName: 'คะน้า',
        scientificName: 'Brassica oleracea var. alboglabra',
        nutrition: {
            vitamins: ['A', 'C', 'K', 'B6'],
            minerals: ['แคลเซียม', 'ธาตุเหล็ก', 'โฟเลต'],
            calories: 25,
            fiber: 'สูง'
        },
        benefits: [
            'บำรุงกระดูกและฟัน',
            'ป้องกันโรคโลหิตจาง',
            'ดีต่อสายตา',
            'ช่วยลดคอเลสเตอรอล'
        ],
        cooking: [
            'กินสด',
            'แกงคั่ว',
            'ผัด',
            'ต้ม'
        ],
        storage: 'เก็บในตู้เย็นได้ 5-7 วัน',
        season: 'ฤดูหนาว'
    },

    'ผักบุ้ง': {
        thaiName: 'ผักบุ้ง',
        scientificName: 'Ipomoea aquatica',
        nutrition: {
            vitamins: ['A', 'C', 'B2'],
            minerals: ['ธาตุเหล็ก', 'แมกนีเซียม', 'โพแทสเซียม'],
            calories: 20,
            fiber: 'ปานกลาง'
        },
        benefits: [
            'ช่วยขับปัสสาวะ',
            'ลดความดันโลหิต',
            'บำรุงผิวพรรณ',
            'ดีต่อระบบย่อยอาหาร'
        ],
        cooking: [
            'ผัดน้ำมันหอย',
            'แกงจืด',
            'ต้ม'
        ],
        storage: 'เก็บในตู้เย็นได้ 2-3 วัน',
        season: 'ฤดูฝน'
    },

    'ผักชี': {
        thaiName: 'ผักชี',
        scientificName: 'Coriandrum sativum',
        nutrition: {
            vitamins: ['A', 'C', 'K'],
            minerals: ['ธาตุเหล็ก', 'แมกนีเซียม', 'แคลเซียม'],
            calories: 23,
            fiber: 'สูง'
        },
        benefits: [
            'ช่วยย่อยอาหาร',
            'ลดคอเลสเตอรอล',
            'ป้องกันมะเร็ง',
            'ดีต่อระบบประสาท'
        ],
        cooking: [
            'โรยหน้า',
            'แกง',
            'ยำ'
        ],
        storage: 'เก็บในตู้เย็นได้ 1-2 สัปดาห์',
        season: 'ปลูกได้ตลอดปี'
    },

    'ขึ้นฉ่าย': {
        thaiName: 'ขึ้นฉ่าย',
        scientificName: 'Ipomoea reptans',
        nutrition: {
            vitamins: ['A', 'C', 'K'],
            minerals: ['แคลเซียม', 'ธาตุเหล็ก', 'โฟเลต'],
            calories: 19,
            fiber: 'สูง'
        },
        benefits: [
            'บำรุงกระดูก',
            'ป้องกันโรคโลหิตจาง',
            'ดีต่อผิวพรรณ',
            'ช่วยลดความเสี่ยงมะเร็ง'
        ],
        cooking: [
            'กินสด',
            'แกงจืด',
            'ยำ',
            'ต้ม'
        ],
        storage: 'เก็บในตู้เย็นได้ 3-5 วัน',
        season: 'ฤดูหนาว'
    },

    // ผักราก
    'แคร์รอต': {
        thaiName: 'แคร์รอต',
        scientificName: 'Daucus carota',
        nutrition: {
            vitamins: ['A', 'C', 'K'],
            minerals: ['โพแทสเซียม', 'แมกนีเซียม'],
            calories: 41,
            fiber: 'สูง'
        },
        benefits: [
            'บำรุงสายตา',
            'ดีต่อผิวพรรณ',
            'ป้องกันมะเร็ง',
            'ช่วยระบบภูมิคุ้มกัน'
        ],
        cooking: [
            'กินสด',
            'นึ่ง',
            'ต้ม',
            'น้ำสลัด'
        ],
        storage: 'เก็บในตู้เย็นได้ 2-3 สัปดาห์',
        season: 'ฤดูหนาว'
    },

    'มันฝรั่ง': {
        thaiName: 'มันฝรั่ง',
        scientificName: 'Solanum tuberosum',
        nutrition: {
            vitamins: ['C', 'B6'],
            minerals: ['โพแทสเซียม', 'แมกนีเซียม'],
            calories: 77,
            fiber: 'ปานกลาง'
        },
        benefits: [
            'ให้พลังงาน',
            'ดีต่อหัวใจ',
            'บำรุงผิว',
            'ช่วยระบบประสาท'
        ],
        cooking: [
            'อบ',
            'ทอด',
            'ต้ม',
            'นึ่ง'
        ],
        storage: 'เก็บในที่เย็นมืดได้ 1-2 เดือน',
        season: 'ปลูกได้ตลอดปี'
    },

    // ผักผล
    'มะเขือเทศ': {
        thaiName: 'มะเขือเทศ',
        scientificName: 'Solanum lycopersicum',
        nutrition: {
            vitamins: ['A', 'C', 'K'],
            minerals: ['โพแทสเซียม', 'ไลโคปีน'],
            calories: 18,
            fiber: 'ปานกลาง'
        },
        benefits: [
            'ป้องกันมะเร็ง',
            'ดีต่อหัวใจ',
            'บำรุงผิว',
            'ช่วยลดน้ำหนัก'
        ],
        cooking: [
            'กินสด',
            'สลัด',
            'ซุป',
            'อบ'
        ],
        storage: 'เก็บในอุณหภูมิห้องได้ 5-7 วัน',
        season: 'ฤดูหนาว'
    },

    'พริก': {
        thaiName: 'พริก',
        scientificName: 'Capsicum annuum',
        nutrition: {
            vitamins: ['A', 'C'],
            minerals: ['โพแทสเซียม'],
            calories: 40,
            fiber: 'สูง'
        },
        benefits: [
            'เผาผลาญไขมัน',
            'ดีต่อหัวใจ',
            'บำรุงผิว',
            'ช่วยระบบภูมิคุ้มกัน'
        ],
        cooking: [
            'กินสด',
            'ผัด',
            'แกง',
            'น้ำสลัด'
        ],
        storage: 'เก็บในตู้เย็นได้ 1-2 สัปดาห์',
        season: 'ปลูกได้ตลอดปี'
    }
};

// ฟังก์ชันช่วยเหลือสำหรับค้นหาผัก
export const findVegetable = (query) => {
    const normalizedQuery = query.toLowerCase().trim();
    return Object.values(VEGETABLE_KNOWLEDGE).find(veg =>
        veg.thaiName.toLowerCase().includes(normalizedQuery) ||
        veg.scientificName.toLowerCase().includes(normalizedQuery)
    );
};

// ฟังก์ชันสำหรับสร้างคำตอบอัตโนมัติ
export const generateVegetableResponse = (query, vegetable) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('โภชนาการ') || lowerQuery.includes('วิตามิน')) {
        return `${vegetable.thaiName} มีคุณค่าทางโภชนาการสูง:\n• วิตามิน: ${vegetable.nutrition.vitamins.join(', ')}\n• แร่ธาตุ: ${vegetable.nutrition.minerals.join(', ')}\n• แคลอรี่: ${vegetable.nutrition.calories} kcal/100g\n• ไฟเบอร์: ${vegetable.nutrition.fiber}`;
    }

    if (lowerQuery.includes('ประโยชน์') || lowerQuery.includes('ดีต่อ')) {
        return `ประโยชน์ของ${vegetable.thaiName}:\n${vegetable.benefits.map(benefit => `• ${benefit}`).join('\n')}`;
    }

    if (lowerQuery.includes('ปรุง') || lowerQuery.includes('ทำ') || lowerQuery.includes('วิธี')) {
        return `วิธีปรุง${vegetable.thaiName}:\n${vegetable.cooking.map(method => `• ${method}`).join('\n')}`;
    }

    if (lowerQuery.includes('เก็บ') || lowerQuery.includes('เก็บรักษา')) {
        return `วิธีเก็บรักษา${vegetable.thaiName}: ${vegetable.storage}`;
    }

    if (lowerQuery.includes('ฤดู') || lowerQuery.includes('ปลูก')) {
        return `${vegetable.thaiName} ${vegetable.season}`;
    }

    // ข้อมูลทั่วไป
    return `${vegetable.thaiName} (${vegetable.scientificName})\n\nโภชนาการ: วิตามิน ${vegetable.nutrition.vitamins.join(', ')}\nประโยชน์: ${vegetable.benefits[0]}\nวิธีปรุง: ${vegetable.cooking.slice(0, 2).join(', ')}\n\n${vegetable.storage}`;
};