/**
 * «إِتْقَانْ» - مدير التخزين وقواعد البيانات المحلية (StorageManager)
 * تشغيل بدون إنترنت بنسبة 100%، مزامنة ديناميكية ذكية، ونسخ احتياطي فوري
 */

const STORAGE_KEYS = {
  STUDENTS: "etgan_students_v1",
  SESSIONS: "etgan_daily_sessions_v1",
  ATTENDANCE: "etgan_attendance_v1",
  SETTINGS: "etgan_settings_v1",
  LAST_BACKUP: "etgan_last_backup_date"
};

class StorageManager {
  constructor() {
    this._initDefaults();
  }

  _initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      const defaultSettings = {
        theme: "dark",
        defaultCountryCode: "+970",
        viewMode: "full"
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  }

  // ===================== الإعدادات =====================
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { theme: "dark", defaultCountryCode: "+970", viewMode: "full" };
    } catch (e) {
      console.error("خطأ في قراءة الإعدادات:", e);
      return { theme: "dark", defaultCountryCode: "+970", viewMode: "full" };
    }
  }

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("خطأ في حفظ الإعدادات:", e);
      return null;
    }
  }

  // ===================== إدارة الطلاب =====================
  getStudents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("خطأ في جلب بيانات الطلاب:", e);
      return [];
    }
  }

  getStudentById(id) {
    const students = this.getStudents();
    return students.find(s => s.id === id) || null;
  }

  saveStudent(studentData) {
    const students = this.getStudents();
    if (studentData.id) {
      // تعديل طالب موجود
      const index = students.findIndex(s => s.id === studentData.id);
      if (index !== -1) {
        const order = studentData.memorizationOrder || students[index].memorizationOrder || "nas_to_fatiha";
        students[index] = {
          ...students[index],
          ...studentData,
          memorizationOrder: order,
          updatedAt: new Date().toISOString()
        };

        // إعادة احتساب تقدم الأجزاء فورياً وفق المنهج المختار
        if (Array.isArray(students[index].dailyLogs) && window.QuranData) {
          const progress = window.QuranData.calculateStudentJuzProgress(students[index].dailyLogs, order);
          students[index].completedAjza = progress.completedAjza;
          students[index].currentJuzNumber = progress.currentJuzNumber;
          students[index].currentJuzProgressPercent = progress.currentJuzProgressPercent;
          students[index].furthestPointText = progress.furthestPointText;
        }
        studentData = students[index];
      } else {
        students.push(studentData);
      }
    } else {
      // إضافة طالب جديد
      const order = studentData.memorizationOrder || "nas_to_fatiha";
      const newStudent = {
        id: "std_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name: studentData.name ? studentData.name.trim() : "",
        dob: studentData.dob || "",
        nationalId: studentData.nationalId ? studentData.nationalId.trim() : "",
        fatherId: studentData.fatherId ? studentData.fatherId.trim() : "",
        countryCode: studentData.countryCode || "+970",
        phone: studentData.phone ? studentData.phone.trim() : "",
        walletType: studentData.walletType || "palpay",
        walletNumber: studentData.walletNumber ? studentData.walletNumber.trim() : "",
        guardianName: studentData.guardianName ? studentData.guardianName.trim() : "",
        residence: studentData.residence ? studentData.residence.trim() : "",
        memorizationOrder: order,
        completedAjza: 0,
        currentJuzNumber: (order === "fatiha_to_nas" ? 1 : 30),
        currentJuzProgressPercent: 0,
        furthestPointText: "لم يبدأ بعد",
        createdAt: new Date().toISOString(),
        dailyLogs: [],
        exams: []
      };
      students.unshift(newStudent);
      studentData = newStudent;
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return studentData;
  }

  deleteStudent(id) {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    // إزالة الطالب من كافة سجلات الغياب السابقة
    const attendanceMap = this.getAttendanceMap();
    let modified = false;
    Object.keys(attendanceMap).forEach(date => {
      const record = attendanceMap[date];
      if (record && record.absentStudentIds && record.absentStudentIds.includes(id)) {
        record.absentStudentIds = record.absentStudentIds.filter(item => item !== id);
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceMap));
    }
    return true;
  }

  // ===================== جلسات ورد اليوم والمقرر والترحيل الذكي =====================
  getDailySessionsMap() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("خطأ في قراءة المقررات اليومية:", e);
      return {};
    }
  }

  getSessionForDate(date) {
    const map = this.getDailySessionsMap();
    return map[date] || {
      surahName: "",
      pageNumber: "",
      lessonTitle: "",
      lessonPage: "",
      talqeenCarriedFrom: null,
      wadhCarriedFrom: null
    };
  }

  /**
   * البحث العكسي الذكي عن آخر ورد تلقين مسجل في التاريخ قبل تاريخ معين
   */
  getLatestRecordedTalqeen(beforeDate = null) {
    const map = this.getDailySessionsMap();
    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    for (const d of sortedDates) {
      if (beforeDate && d >= beforeDate) continue;
      const item = map[d];
      if (item && item.surahName) {
        return {
          date: d,
          surahName: item.surahName,
          fromAyah: item.fromAyah || 1,
          toAyah: item.toAyah || item.fromAyah || 1,
          pageNumber: item.pageNumber || null,
          originalSourceDate: item.talqeenCarriedFrom || d
        };
      }
    }
    return null;
  }

  /**
   * البحث العكسي الذكي عن آخر درس وعظ مسجل في التاريخ قبل تاريخ معين
   */
  getLatestRecordedWadh(beforeDate = null) {
    const map = this.getDailySessionsMap();
    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    for (const d of sortedDates) {
      if (beforeDate && d >= beforeDate) continue;
      const item = map[d];
      if (item && item.lessonTitle) {
        return {
          date: d,
          lessonTitle: item.lessonTitle,
          lessonPage: item.lessonPage || "",
          originalSourceDate: item.wadhCarriedFrom || d
        };
      }
    }
    return null;
  }

  /**
   * ضمان تسجيل جلسة اليوم بالترحيل التلقائي الصامت والمستقل لكل بطاقة:
   * إذا لم يكن لليوم ورد تلقين، يُرحّل آخر ورد مسجل مع وسم تاريخ المصدر الأصلي.
   * إذا لم يكن لليوم درس وعظ، يُرحّل آخر درس مسجل مع وسم تاريخ المصدر الأصلي.
   */
  ensureDailySessionWithCarryOver(todayDate) {
    const map = this.getDailySessionsMap();
    let current = map[todayDate] ? { ...map[todayDate] } : null;
    let modified = false;

    if (!current) {
      current = {
        date: todayDate,
        updatedAt: new Date().toISOString()
      };
      modified = true;
    }

    // 1. ترحيل التلقين إذا لم يكن مسجلاً لليوم
    if (!current.surahName) {
      const latestTalqeen = this.getLatestRecordedTalqeen(todayDate);
      if (latestTalqeen) {
        current.surahName = latestTalqeen.surahName;
        current.fromAyah = latestTalqeen.fromAyah;
        current.toAyah = latestTalqeen.toAyah;
        current.pageNumber = latestTalqeen.pageNumber;
        current.talqeenCarriedFrom = latestTalqeen.originalSourceDate;
        modified = true;
      }
    }

    // 2. ترحيل درس الوعظ إذا لم يكن مسجلاً لليوم
    if (!current.lessonTitle) {
      const latestWadh = this.getLatestRecordedWadh(todayDate);
      if (latestWadh) {
        current.lessonTitle = latestWadh.lessonTitle;
        current.lessonPage = latestWadh.lessonPage;
        current.wadhCarriedFrom = latestWadh.originalSourceDate;
        modified = true;
      }
    }

    if (modified) {
      map[todayDate] = current;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(map));
    }

    return current;
  }

  saveSessionForDate(date, sessionData) {
    const map = this.getDailySessionsMap();
    map[date] = {
      ...(map[date] || {}),
      ...sessionData,
      date: date,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(map));
    return map[date];
  }

  saveTalqeenForDate(date, { surahName, fromAyah, toAyah, pageNumber }) {
    const map = this.getDailySessionsMap();
    const fAyah = parseInt(fromAyah, 10) || 1;
    const tAyah = parseInt(toAyah, 10) || fAyah;
    map[date] = {
      ...(map[date] || {}),
      surahName: surahName,
      fromAyah: fAyah,
      toAyah: tAyah,
      pageNumber: pageNumber || null,
      talqeenCarriedFrom: null, // تم الاعتماد والتعديل المباشر لليوم
      date: date,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(map));
    return map[date];
  }

  saveWadhForDate(date, { lessonTitle, lessonPage }) {
    const map = this.getDailySessionsMap();
    map[date] = {
      ...(map[date] || {}),
      lessonTitle: lessonTitle,
      lessonPage: lessonPage,
      wadhCarriedFrom: null, // تم الاعتماد والتعديل المباشر لليوم
      date: date,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(map));
    return map[date];
  }

  getAllTalqeenRecords() {
    const map = this.getDailySessionsMap();
    const records = [];
    Object.keys(map).forEach(date => {
      const item = map[date];
      if (item && item.surahName) {
        records.push({
          date: date,
          surahName: item.surahName,
          fromAyah: item.fromAyah || 1,
          toAyah: item.toAyah || item.fromAyah || 1,
          pageNumber: item.pageNumber || null,
          talqeenCarriedFrom: item.talqeenCarriedFrom || null,
          updatedAt: item.updatedAt
        });
      }
    });
    records.sort((a, b) => b.date.localeCompare(a.date));
    return records;
  }

  getAllWadhRecords() {
    const map = this.getDailySessionsMap();
    const records = [];
    Object.keys(map).forEach(date => {
      const item = map[date];
      if (item && item.lessonTitle) {
        records.push({
          date: date,
          lessonTitle: item.lessonTitle,
          lessonPage: item.lessonPage || "",
          wadhCarriedFrom: item.wadhCarriedFrom || null,
          updatedAt: item.updatedAt
        });
      }
    });
    records.sort((a, b) => b.date.localeCompare(a.date));
    return records;
  }

  getAllExamsRecords() {
    const students = this.getStudents();
    const allExams = [];
    students.forEach(student => {
      if (Array.isArray(student.exams)) {
        student.exams.forEach(exam => {
          allExams.push({
            id: exam.id,
            studentId: student.id,
            studentName: student.name,
            examName: exam.examName,
            result: exam.result,
            date: exam.date,
            notes: exam.notes || ""
          });
        });
      }
    });
    allExams.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return allExams;
  }

  // ===================== سجلات الحضور والغياب والمزامنة الذكية =====================
  getAttendanceMap() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("خطأ في قراءة سجلات الحضور:", e);
      return {};
    }
  }

  getAttendanceForDate(date) {
    const map = this.getAttendanceMap();
    const allStudents = this.getStudents();
    if (!map[date]) {
      return {
        date: date,
        absentStudentIds: [],
        totalStudents: allStudents.length
      };
    }
    return map[date];
  }

  /**
   * مزامنة رصد الغياب مع سجل الطلاب
   * يحفظ الغياب لليوم، ويحدث سجلات الطلاب تلقائياً بشارة (غائب ⚠️)
   */
  syncAttendance(date, absentStudentIds) {
    const map = this.getAttendanceMap();
    const students = this.getStudents();

    // حفظ سجل الحضور العام
    map[date] = {
      date: date,
      absentStudentIds: absentStudentIds,
      totalStudents: students.length,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(map));

    // تحديث سجل كل طالب
    students.forEach(student => {
      if (!Array.isArray(student.dailyLogs)) {
        student.dailyLogs = [];
      }

      const isAbsent = absentStudentIds.includes(student.id);
      const logIndex = student.dailyLogs.findIndex(l => l.date === date);

      if (isAbsent) {
        if (logIndex !== -1) {
          // إذا كان موجوداً، نحوله لغائب ونفرغ التسميع إلا إذا تم رصده سابقاً
          student.dailyLogs[logIndex].isAbsent = true;
        } else {
          // إضافة قيد غياب جديد
          student.dailyLogs.unshift({
            id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            date: date,
            isAbsent: true,
            memoFromSurah: "",
            memoFromPage: null,
            memoToSurah: "",
            memoToPage: null,
            revFromSurah: "",
            revFromPage: null,
            revToSurah: "",
            revToPage: null,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // الطالب حاضر
        if (logIndex !== -1) {
          // إذا كان مسجلاً كغائب فقط وبدون أي تسميع سابق، نزيل قيد الغياب
          const existing = student.dailyLogs[logIndex];
          const hasMemo = existing.memoFromSurah || existing.memoFromPage;
          const hasRev = existing.revFromSurah || existing.revFromPage;
          if (existing.isAbsent && !hasMemo && !hasRev) {
            student.dailyLogs.splice(logIndex, 1);
          } else {
            existing.isAbsent = false;
          }
        }
      }

      // ترتيب السجلات تنازلياً حسب التاريخ
      student.dailyLogs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return map[date];
  }

  /**
   * رصد الحفظ والمراجعة لطالب مع مزامنة ذكية فورية:
   * إذا كان مسجلاً غائباً اليوم، يُلغى غيابه تلقائياً ويتحول إلى حاضر
   */
  saveStudentDailyLog(studentId, logData) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    if (!Array.isArray(student.dailyLogs)) {
      student.dailyLogs = [];
    }

    const targetDate = logData.date;
    const logIndex = student.dailyLogs.findIndex(l => l.date === targetDate);

    const fAyahMemo = logData.memoFromAyah ? parseInt(logData.memoFromAyah, 10) : null;
    const tAyahMemo = logData.memoToAyah ? parseInt(logData.memoToAyah, 10) : fAyahMemo;

    const fAyahRev = logData.revFromAyah ? parseInt(logData.revFromAyah, 10) : null;
    const tAyahRev = logData.revToAyah ? parseInt(logData.revToAyah, 10) : fAyahRev;

    const newEntry = {
      id: (logIndex !== -1 && student.dailyLogs[logIndex].id) ? student.dailyLogs[logIndex].id : ("log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)),
      date: targetDate,
      isAbsent: false, // تحويل فوري لحاضر
      memoSurah: logData.memoSurah || logData.memoFromSurah || "",
      memoFromAyah: fAyahMemo,
      memoToAyah: tAyahMemo,
      revSurah: logData.revSurah || logData.revFromSurah || "",
      revFromAyah: fAyahRev,
      revToAyah: tAyahRev,
      // دعم الحقول القديمة للحفاظ على البيانات السابقة
      memoFromSurah: logData.memoSurah || logData.memoFromSurah || "",
      memoToSurah: logData.memoSurah || logData.memoToSurah || "",
      revFromSurah: logData.revSurah || logData.revFromSurah || "",
      revToSurah: logData.revSurah || logData.revToSurah || "",
      updatedAt: new Date().toISOString()
    };

    if (logIndex !== -1) {
      student.dailyLogs[logIndex] = newEntry;
    } else {
      student.dailyLogs.unshift(newEntry);
    }

    // ترتيب السجلات تنازلياً
    student.dailyLogs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    // إعادة احتساب الأجزاء المنجزة ونسبة التقدم تلقائياً للطالب
    if (window.QuranData) {
      const order = student.memorizationOrder || "nas_to_fatiha";
      const progress = window.QuranData.calculateStudentJuzProgress(student.dailyLogs, order);
      student.completedAjza = progress.completedAjza;
      student.currentJuzNumber = progress.currentJuzNumber;
      student.currentJuzProgressPercent = progress.currentJuzProgressPercent;
      student.furthestPointText = progress.furthestPointText;
    }

    // تحديث مصفوفة الطلاب
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // تحديث سجل الغياب العام إن كان الطالب مسجلاً كغائب في هذا اليوم
    const attendanceMap = this.getAttendanceMap();
    if (attendanceMap[targetDate] && attendanceMap[targetDate].absentStudentIds.includes(studentId)) {
      attendanceMap[targetDate].absentStudentIds = attendanceMap[targetDate].absentStudentIds.filter(id => id !== studentId);
      attendanceMap[targetDate].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceMap));
    }

    return newEntry;
  }

  deleteStudentDailyLog(studentId, logId) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student || !Array.isArray(student.dailyLogs)) return false;

    student.dailyLogs = student.dailyLogs.filter(l => l.id !== logId);

    // إعادة احتساب الأجزاء المنجزة بعد الحذف
    if (window.QuranData) {
      const order = student.memorizationOrder || "nas_to_fatiha";
      const progress = window.QuranData.calculateStudentJuzProgress(student.dailyLogs, order);
      student.completedAjza = progress.completedAjza;
      student.currentJuzNumber = progress.currentJuzNumber;
      student.currentJuzProgressPercent = progress.currentJuzProgressPercent;
      student.furthestPointText = progress.furthestPointText;
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  // ===================== سجل الاختبارات =====================
  saveStudentExam(studentId, examData) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    if (!Array.isArray(student.exams)) {
      student.exams = [];
    }

    const newExam = {
      id: examData.id || ("exam_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)),
      studentId: studentId,
      examName: examData.examName ? examData.examName.trim() : "",
      result: examData.result ? examData.result.trim() : "",
      date: examData.date || new Date().toISOString().split("T")[0],
      notes: examData.notes ? examData.notes.trim() : "",
      createdAt: new Date().toISOString()
    };

    if (examData.id) {
      const idx = student.exams.findIndex(e => e.id === examData.id);
      if (idx !== -1) {
        student.exams[idx] = newExam;
      } else {
        student.exams.unshift(newExam);
      }
    } else {
      student.exams.unshift(newExam);
    }

    student.exams.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return newExam;
  }

  deleteStudentExam(studentId, examId) {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student || !Array.isArray(student.exams)) return false;

    student.exams = student.exams.filter(e => e.id !== examId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  // ===================== سجل الأيام السابقة (History) =====================
  getAllRecordedDates() {
    const sessionsMap = this.getDailySessionsMap();
    const attendanceMap = this.getAttendanceMap();
    const students = this.getStudents();

    const datesSet = new Set();
    Object.keys(sessionsMap).forEach(d => datesSet.add(d));
    Object.keys(attendanceMap).forEach(d => datesSet.add(d));
    students.forEach(s => {
      if (Array.isArray(s.dailyLogs)) {
        s.dailyLogs.forEach(l => {
          if (l.date) datesSet.add(l.date);
        });
      }
    });

    const dates = Array.from(datesSet);
    dates.sort((a, b) => b.localeCompare(a));
    return dates;
  }

  getDayFullSummary(date) {
    const session = this.getSessionForDate(date);
    const attendance = this.getAttendanceForDate(date);
    const students = this.getStudents();

    const absentStudents = students.filter(s => attendance.absentStudentIds && attendance.absentStudentIds.includes(s.id));
    const presentStudentsCount = students.length - absentStudents.length;

    return {
      date: date,
      session: session,
      attendance: attendance,
      totalStudents: students.length,
      presentCount: Math.max(0, presentStudentsCount),
      absentCount: absentStudents.length,
      absentStudents: absentStudents
    };
  }

  deleteDayRecord(date) {
    // حذف المقرر
    const sessions = this.getDailySessionsMap();
    delete sessions[date];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    // حذف الحضور
    const attendance = this.getAttendanceMap();
    delete attendance[date];
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));

    // إزالة قيود اليوم من سجلات الطلاب
    const students = this.getStudents();
    students.forEach(s => {
      if (Array.isArray(s.dailyLogs)) {
        s.dailyLogs = s.dailyLogs.filter(l => l.date !== date);
      }
    });
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  // ===================== النسخ الاحتياطي وأمان البيانات =====================
  checkBackupReminder() {
    const lastBackupStr = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    const students = this.getStudents();
    if (students.length === 0) return { shouldRemind: false, days: 0 };

    if (!lastBackupStr) {
      return { shouldRemind: true, days: 30, neverBackedUp: true };
    }

    const lastBackup = new Date(lastBackupStr);
    const now = new Date();
    const diffTime = Math.abs(now - lastBackup);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      shouldRemind: diffDays >= 30,
      days: diffDays,
      lastBackupDate: lastBackupStr
    };
  }

  markBackupCompleted() {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
    return now;
  }

  exportDataAsJSON() {
    const exportObject = {
      app: "Etgan Quran Ring Manager",
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      students: this.getStudents(),
      sessions: this.getDailySessionsMap(),
      attendance: this.getAttendanceMap(),
      settings: this.getSettings()
    };

    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `itqan_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.markBackupCompleted();
    return true;
  }

  importDataFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || (!parsed.students && !Array.isArray(parsed))) {
        throw new Error("ملف النسخة الاحتياطية غير صالح أو تالف.");
      }

      const students = Array.isArray(parsed) ? parsed : (parsed.students || []);
      const sessions = parsed.sessions || {};
      const attendance = parsed.attendance || {};
      const settings = parsed.settings || this.getSettings();

      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      this.markBackupCompleted();

      return {
        success: true,
        studentsCount: students.length,
        sessionsCount: Object.keys(sessions).length
      };
    } catch (e) {
      console.error("فشل استيراد النسخة الاحتياطية:", e);
      return { success: false, error: e.message };
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.LAST_BACKUP);
    this._initDefaults();
    return true;
  }
}

// إتاحة الكائن عالمياً للاستخدام في التطبيق
window.storageManager = new StorageManager();
