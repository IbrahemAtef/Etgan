/**
 * «إِتْقَانْ» - بيانات سور القرآن الكريم الـ 114
 * مطابقة تماماً لمصحف المدينة النبوية (604 صفحات)
 */

const QURAN_SURAHS = [
  { id: 1, name: "الفاتحة", startPage: 1, endPage: 1, ayat: 7, type: "مكية" },
  { id: 2, name: "البقرة", startPage: 2, endPage: 49, ayat: 286, type: "مدنية" },
  { id: 3, name: "آل عمران", startPage: 50, endPage: 76, ayat: 200, type: "مدنية" },
  { id: 4, name: "النساء", startPage: 77, endPage: 106, ayat: 176, type: "مدنية" },
  { id: 5, name: "المائدة", startPage: 106, endPage: 127, ayat: 120, type: "مدنية" },
  { id: 6, name: "الأنعام", startPage: 128, endPage: 150, ayat: 165, type: "مكية" },
  { id: 7, name: "الأعراف", startPage: 151, endPage: 176, ayat: 206, type: "مكية" },
  { id: 8, name: "الأنفال", startPage: 177, endPage: 186, ayat: 75, type: "مدنية" },
  { id: 9, name: "التوبة", startPage: 187, endPage: 207, ayat: 129, type: "مدنية" },
  { id: 10, name: "يونس", startPage: 208, endPage: 221, ayat: 109, type: "مكية" },
  { id: 11, name: "هود", startPage: 221, endPage: 235, ayat: 123, type: "مكية" },
  { id: 12, name: "يوسف", startPage: 235, endPage: 248, ayat: 111, type: "مكية" },
  { id: 13, name: "الرعد", startPage: 249, endPage: 255, ayat: 43, type: "مدنية" },
  { id: 14, name: "إبراهيم", startPage: 255, endPage: 261, ayat: 52, type: "مكية" },
  { id: 15, name: "الحجر", startPage: 262, endPage: 267, ayat: 99, type: "مكية" },
  { id: 16, name: "النحل", startPage: 267, endPage: 281, ayat: 128, type: "مكية" },
  { id: 17, name: "الإسراء", startPage: 282, endPage: 293, ayat: 111, type: "مكية" },
  { id: 18, name: "الكهف", startPage: 293, endPage: 304, ayat: 110, type: "مكية" },
  { id: 19, name: "مريم", startPage: 305, endPage: 312, ayat: 98, type: "مكية" },
  { id: 20, name: "طه", startPage: 312, endPage: 321, ayat: 135, type: "مكية" },
  { id: 21, name: "الأنبياء", startPage: 322, endPage: 331, ayat: 112, type: "مكية" },
  { id: 22, name: "الحج", startPage: 332, endPage: 341, ayat: 78, type: "مدنية" },
  { id: 23, name: "المؤمنون", startPage: 342, endPage: 349, ayat: 118, type: "مكية" },
  { id: 24, name: "النور", startPage: 350, endPage: 359, ayat: 64, type: "مدنية" },
  { id: 25, name: "الفرقان", startPage: 359, endPage: 366, ayat: 77, type: "مكية" },
  { id: 26, name: "الشعراء", startPage: 367, endPage: 376, ayat: 227, type: "مكية" },
  { id: 27, name: "النمل", startPage: 377, endPage: 385, ayat: 93, type: "مكية" },
  { id: 28, name: "القصص", startPage: 385, endPage: 396, ayat: 88, type: "مكية" },
  { id: 29, name: "العنكبوت", startPage: 396, endPage: 404, ayat: 69, type: "مكية" },
  { id: 30, name: "الروم", startPage: 404, endPage: 410, ayat: 60, type: "مكية" },
  { id: 31, name: "لقمان", startPage: 411, endPage: 414, ayat: 34, type: "مكية" },
  { id: 32, name: "السجدة", startPage: 415, endPage: 417, ayat: 30, type: "مكية" },
  { id: 33, name: "الأحزاب", startPage: 418, endPage: 427, ayat: 73, type: "مدنية" },
  { id: 34, name: "سبأ", startPage: 428, endPage: 434, ayat: 54, type: "مكية" },
  { id: 35, name: "فاطر", startPage: 434, endPage: 440, ayat: 45, type: "مكية" },
  { id: 36, name: "يس", startPage: 440, endPage: 445, ayat: 83, type: "مكية" },
  { id: 37, name: "الصافات", startPage: 446, endPage: 452, ayat: 182, type: "مكية" },
  { id: 38, name: "ص", startPage: 453, endPage: 458, ayat: 88, type: "مكية" },
  { id: 39, name: "الزمر", startPage: 458, endPage: 467, ayat: 75, type: "مكية" },
  { id: 40, name: "غافر", startPage: 467, endPage: 476, ayat: 85, type: "مكية" },
  { id: 41, name: "فصلت", startPage: 477, endPage: 482, ayat: 54, type: "مكية" },
  { id: 42, name: "الشورى", startPage: 483, endPage: 489, ayat: 53, type: "مكية" },
  { id: 43, name: "الزخرف", startPage: 489, endPage: 495, ayat: 89, type: "مكية" },
  { id: 44, name: "الدخان", startPage: 496, endPage: 498, ayat: 59, type: "مكية" },
  { id: 45, name: "الجاثية", startPage: 499, endPage: 502, ayat: 37, type: "مكية" },
  { id: 46, name: "الأحقاف", startPage: 502, endPage: 506, ayat: 35, type: "مكية" },
  { id: 47, name: "محمد", startPage: 507, endPage: 510, ayat: 38, type: "مدنية" },
  { id: 48, name: "الفتح", startPage: 511, endPage: 515, ayat: 29, type: "مدنية" },
  { id: 49, name: "الحجرات", startPage: 515, endPage: 517, ayat: 18, type: "مدنية" },
  { id: 50, name: "ق", startPage: 518, endPage: 520, ayat: 45, type: "مكية" },
  { id: 51, name: "الذاريات", startPage: 520, endPage: 523, ayat: 60, type: "مكية" },
  { id: 52, name: "الطور", startPage: 523, endPage: 525, ayat: 49, type: "مكية" },
  { id: 53, name: "النجم", startPage: 526, endPage: 528, ayat: 62, type: "مكية" },
  { id: 54, name: "القمر", startPage: 528, endPage: 531, ayat: 55, type: "مكية" },
  { id: 55, name: "الرحمن", startPage: 531, endPage: 534, ayat: 78, type: "مدنية" },
  { id: 56, name: "الواقعة", startPage: 534, endPage: 537, ayat: 96, type: "مكية" },
  { id: 57, name: "الحديد", startPage: 537, endPage: 541, ayat: 29, type: "مدنية" },
  { id: 58, name: "المجادلة", startPage: 542, endPage: 545, ayat: 22, type: "مدنية" },
  { id: 59, name: "الحشر", startPage: 545, endPage: 548, ayat: 24, type: "مدنية" },
  { id: 60, name: "الممتحنة", startPage: 549, endPage: 551, ayat: 13, type: "مدنية" },
  { id: 61, name: "الصف", startPage: 551, endPage: 552, ayat: 14, type: "مدنية" },
  { id: 62, name: "الجمعة", startPage: 553, endPage: 554, ayat: 11, type: "مدنية" },
  { id: 63, name: "المنافقون", startPage: 554, endPage: 555, ayat: 11, type: "مدنية" },
  { id: 64, name: "التغابن", startPage: 556, endPage: 557, ayat: 18, type: "مدنية" },
  { id: 65, name: "الطلاق", startPage: 558, endPage: 559, ayat: 12, type: "مدنية" },
  { id: 66, name: "التحريم", startPage: 560, endPage: 561, ayat: 12, type: "مدنية" },
  { id: 67, name: "الملك", startPage: 562, endPage: 564, ayat: 30, type: "مكية" },
  { id: 68, name: "القلم", startPage: 564, endPage: 566, ayat: 52, type: "مكية" },
  { id: 69, name: "الحاقة", startPage: 566, endPage: 568, ayat: 52, type: "مكية" },
  { id: 70, name: "المعارج", startPage: 568, endPage: 570, ayat: 44, type: "مكية" },
  { id: 71, name: "نوح", startPage: 570, endPage: 571, ayat: 28, type: "مكية" },
  { id: 72, name: "الجن", startPage: 572, endPage: 573, ayat: 28, type: "مكية" },
  { id: 73, name: "المزمل", startPage: 574, endPage: 575, ayat: 20, type: "مكية" },
  { id: 74, name: "المدثر", startPage: 575, endPage: 577, ayat: 56, type: "مكية" },
  { id: 75, name: "القيامة", startPage: 577, endPage: 578, ayat: 40, type: "مكية" },
  { id: 76, name: "الإنسان", startPage: 578, endPage: 580, ayat: 31, type: "مدنية" },
  { id: 77, name: "المرسلات", startPage: 580, endPage: 581, ayat: 50, type: "مكية" },
  { id: 78, name: "النبأ", startPage: 582, endPage: 583, ayat: 40, type: "مكية" },
  { id: 79, name: "النازعات", startPage: 583, endPage: 584, ayat: 46, type: "مكية" },
  { id: 80, name: "عبس", startPage: 585, endPage: 586, ayat: 42, type: "مكية" },
  { id: 81, name: "التكوير", startPage: 586, endPage: 586, ayat: 29, type: "مكية" },
  { id: 82, name: "الانفطار", startPage: 587, endPage: 587, ayat: 19, type: "مكية" },
  { id: 83, name: "المطففين", startPage: 587, endPage: 589, ayat: 36, type: "مكية" },
  { id: 84, name: "الانشقاق", startPage: 589, endPage: 590, ayat: 25, type: "مكية" },
  { id: 85, name: "البروج", startPage: 590, endPage: 590, ayat: 22, type: "مكية" },
  { id: 86, name: "الطارق", startPage: 591, endPage: 591, ayat: 17, type: "مكية" },
  { id: 87, name: "الأعلى", startPage: 591, endPage: 592, ayat: 19, type: "مكية" },
  { id: 88, name: "الغاشية", startPage: 592, endPage: 593, ayat: 26, type: "مكية" },
  { id: 89, name: "الفجر", startPage: 593, endPage: 594, ayat: 30, type: "مكية" },
  { id: 90, name: "البلد", startPage: 594, endPage: 595, ayat: 20, type: "مكية" },
  { id: 91, name: "الشمس", startPage: 595, endPage: 595, ayat: 15, type: "مكية" },
  { id: 92, name: "الليل", startPage: 595, endPage: 596, ayat: 21, type: "مكية" },
  { id: 93, name: "الضحى", startPage: 596, endPage: 596, ayat: 11, type: "مكية" },
  { id: 94, name: "الشرح", startPage: 596, endPage: 596, ayat: 8, type: "مكية" },
  { id: 95, name: "التين", startPage: 597, endPage: 597, ayat: 8, type: "مكية" },
  { id: 96, name: "العلق", startPage: 597, endPage: 598, ayat: 19, type: "مكية" },
  { id: 97, name: "القدر", startPage: 598, endPage: 598, ayat: 5, type: "مكية" },
  { id: 98, name: "البينة", startPage: 598, endPage: 599, ayat: 8, type: "مدنية" },
  { id: 99, name: "الزلزلة", startPage: 599, endPage: 599, ayat: 8, type: "مدنية" },
  { id: 100, name: "العاديات", startPage: 599, endPage: 600, ayat: 11, type: "مكية" },
  { id: 101, name: "القارعة", startPage: 600, endPage: 600, ayat: 11, type: "مكية" },
  { id: 102, name: "التكاثر", startPage: 600, endPage: 600, ayat: 8, type: "مكية" },
  { id: 103, name: "العصر", startPage: 601, endPage: 601, ayat: 3, type: "مكية" },
  { id: 104, name: "الهمزة", startPage: 601, endPage: 601, ayat: 9, type: "مكية" },
  { id: 105, name: "الفيل", startPage: 601, endPage: 601, ayat: 5, type: "مكية" },
  { id: 106, name: "قريش", startPage: 602, endPage: 602, ayat: 4, type: "مكية" },
  { id: 107, name: "الماعون", startPage: 602, endPage: 602, ayat: 7, type: "مكية" },
  { id: 108, name: "الكوثر", startPage: 602, endPage: 602, ayat: 3, type: "مكية" },
  { id: 109, name: "الكافرون", startPage: 603, endPage: 603, ayat: 6, type: "مكية" },
  { id: 110, name: "النصر", startPage: 603, endPage: 603, ayat: 3, type: "مدنية" },
  { id: 111, name: "المسد", startPage: 603, endPage: 603, ayat: 5, type: "مكية" },
  { id: 112, name: "الإخلاص", startPage: 604, endPage: 604, ayat: 4, type: "مكية" },
  { id: 113, name: "الفلق", startPage: 604, endPage: 604, ayat: 5, type: "مكية" },
  { id: 114, name: "الناس", startPage: 604, endPage: 604, ayat: 6, type: "مكية" }
];

/**
 * دوال مساعدة لبيانات سور القرآن
 */
const QuranData = {
  getAllSurahs() {
    return QURAN_SURAHS;
  },

  getSurahById(id) {
    const numericId = parseInt(id, 10);
    return QURAN_SURAHS.find(s => s.id === numericId) || null;
  },

  getSurahByName(name) {
    if (!name) return null;
    const clean = name.trim().replace(/^سورة\s+/, "");
    return QURAN_SURAHS.find(s => s.name === clean || s.name === name) || null;
  },

  getPageRange(surahIdOrName) {
    let surah = null;
    if (typeof surahIdOrName === "number" || !isNaN(Number(surahIdOrName))) {
      surah = this.getSurahById(surahIdOrName);
    } else {
      surah = this.getSurahByName(surahIdOrName);
    }
    if (!surah) return { start: 1, end: 604 };
    return { start: surah.startPage, end: surah.endPage };
  },

  populateSurahSelect(selectElement, defaultSurahName = "", placeholder = "اختر السورة...") {
    if (!selectElement) return;
    let html = placeholder ? `<option value="">${placeholder}</option>` : "";
    QURAN_SURAHS.forEach(surah => {
      const isSelected = (surah.name === defaultSurahName || surah.id === defaultSurahName) ? "selected" : "";
      html += `<option value="${surah.name}" data-id="${surah.id}" data-start="${surah.startPage}" data-end="${surah.endPage}" ${isSelected}>${surah.id}. سورة ${surah.name} (${surah.type} - ص ${surah.startPage})</option>`;
    });
    selectElement.innerHTML = html;
  },

  applyPageConstraints(surahSelectElement, pageInputElement) {
    if (!surahSelectElement || !pageInputElement) return;
    const selectedOption = surahSelectElement.options[surahSelectElement.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
      pageInputElement.min = 1;
      pageInputElement.max = 604;
      return;
    }
    const start = parseInt(selectedOption.getAttribute("data-start"), 10) || 1;
    const end = parseInt(selectedOption.getAttribute("data-end"), 10) || 604;
    pageInputElement.min = start;
    pageInputElement.max = end;
    pageInputElement.placeholder = `${start} - ${end}`;
    
    // ضبط القيمة تلقائياً إلى صفحة بداية السورة إذا كانت فارغة أو خارج النطاق
    const currentVal = parseInt(pageInputElement.value, 10);
    if (!currentVal || currentVal < start || currentVal > end) {
      pageInputElement.value = start;
    }
  }
};

// إتاحة الكائن عالمياً للاستخدام في المتصفح
window.QuranData = QuranData;
window.QURAN_SURAHS = QURAN_SURAHS;
