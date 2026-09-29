/**
 * «إِتْقَانْ» - وحدة التحكم المركزية للتطبيق (Main App Controller - v2.0)
 * نظام إدارة حلقات تحفيظ القرآن الكريم
 * - نظام التواريخ: يوم/شهر/سنة (DD/MM/YYYY)
 * - نوافذ منفصلة لورد التلقين ودرس الوعظ
 * - مركز السجلات والأرشيف (أيام، تلقين، وعظ، واختبارات مع فلترة الشهر)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. المتغيرات والحالة العامة (App State)
  // ==========================================================================
  const state = {
    today: getTodayDateString(),
    currentFilter: "all", // 'all' | 'present' | 'absent' | 'pending'
    searchQuery: "",
    viewMode: "full", // 'full' | 'compact'
    historyFilter: "all", // 'all' | 'has-absence' | 'full'
    historyDateQuery: "",
    archiveActiveTab: "attendance", // 'attendance' | 'talqeen' | 'wadh' | 'exams'
    wadhSearchQuery: "",
    examArchiveSearchQuery: "",
    examArchiveMonthFilter: "",
    selectedStudentIdForProfile: null,
    attendanceModalSelectedAbsents: new Set(),
    attendanceModalTargetDate: getTodayDateString(),
    confirmCallback: null
  };

  // ==========================================================================
  // 2. التهيئة الأولية (Initialization)
  // ==========================================================================
  initTheme();
  initDateDisplay();
  initPwaAndNetwork();
  initSurahDropdowns();
  loadInitialData();
  bindEvents();
  checkBackupAlert();

  // ==========================================================================
  // 3. إدارة وتنسيق التواريخ (Date Formatting: DD/MM/YYYY)
  // ==========================================================================
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * تحويل التاريخ إلى صيغة يوم/شهر/سنة (DD/MM/YYYY)
   * مع إمكانية إلحاق اسم اليوم بالعربية
   */
  function formatDateDDMMYYYY(dateStr, includeDayName = false) {
    if (!dateStr) return "";
    try {
      const cleanDate = dateStr.split("T")[0];
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        const formattedDate = `${day}/${month}/${year}`;

        if (includeDayName) {
          const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
          const dayName = dayNames[d.getDay()] || "";
          return `${dayName}، ${formattedDate}`;
        }
        return formattedDate;
      }
    } catch (e) {
      console.error("خطأ في تنسيق التاريخ:", e);
    }
    return dateStr;
  }

  function initDateDisplay() {
    const el = document.getElementById("currentDateDisplay");
    if (el) {
      el.textContent = formatDateDDMMYYYY(state.today, true);
    }
    const talqeenBadge = document.getElementById("talqeenDateBadge");
    if (talqeenBadge) talqeenBadge.textContent = formatDateDDMMYYYY(state.today);
    const wadhBadge = document.getElementById("wadhDateBadge");
    if (wadhBadge) wadhBadge.textContent = formatDateDDMMYYYY(state.today);
  }

  function initTheme() {
    const settings = window.storageManager.getSettings();
    const isLight = settings.theme === "light";
    if (isLight) {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
    updateThemeIcon(isLight);

    state.viewMode = settings.viewMode || "full";
    applyViewMode(state.viewMode);
  }

  function updateThemeIcon(isLight) {
    const icon = document.getElementById("themeToggleIcon");
    if (icon) {
      icon.textContent = isLight ? "☀️" : "🌙";
    }
  }

  function toggleTheme() {
    const isNowLight = document.body.classList.toggle("theme-light");
    const newTheme = isNowLight ? "light" : "dark";
    window.storageManager.saveSettings({ theme: newTheme });
    updateThemeIcon(isNowLight);
    showToast(isNowLight ? "تم تفعيل الوضع النهاري" : "تم تفعيل الوضع الليلي الملكي", "info");
  }

  function applyViewMode(mode) {
    state.viewMode = mode;
    const container = document.getElementById("studentsContainer");
    const fullBtn = document.getElementById("viewModeFullBtn");
    const compactBtn = document.getElementById("viewModeCompactBtn");

    if (container) {
      if (mode === "compact") {
        container.classList.add("compact-mode");
      } else {
        container.classList.remove("compact-mode");
      }
    }

    if (fullBtn && compactBtn) {
      fullBtn.classList.toggle("active", mode === "full");
      compactBtn.classList.toggle("active", mode === "compact");
    }

    window.storageManager.saveSettings({ viewMode: mode });
  }

  // ==========================================================================
  // 4. تشغيل PWA والاتصال (PWA & Offline Connectivity)
  // ==========================================================================
  function initPwaAndNetwork() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(reg => {
        console.log("Service Worker مسجل بنجاح:", reg.scope);
      }).catch(err => {
        console.warn("فشل تسجيل Service Worker:", err);
      });
    }

    const updateOnlineStatus = () => {
      const badge = document.getElementById("networkStatusBadge");
      const text = document.getElementById("networkStatusText");
      if (!badge || !text) return;

      if (navigator.onLine) {
        badge.classList.add("online");
        text.textContent = "متصل بالإنترنت";
      } else {
        badge.classList.remove("online");
        text.textContent = "يعمل بدون إنترنت (أوفلاين)";
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }

  // ==========================================================================
  // 5. تهيئة قوائم السور القرانية والتقييد الصارم للصفحات
  // ==========================================================================
  function initSurahDropdowns() {
    const selectIds = [
      "talqeenSurahSelect",
      "memoFromSurahSelect",
      "memoToSurahSelect",
      "revFromSurahSelect",
      "revToSurahSelect"
    ];

    selectIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        window.QuranData.populateSurahSelect(el, "", "اختر السورة...");
      }
    });

    bindSurahPageConstraint("talqeenSurahSelect", "talqeenPageInput");
    bindSurahPageConstraint("memoFromSurahSelect", "memoFromPageInput");
    bindSurahPageConstraint("memoToSurahSelect", "memoToPageInput");
    bindSurahPageConstraint("revFromSurahSelect", "revFromPageInput");
    bindSurahPageConstraint("revToSurahSelect", "revToPageInput");
  }

  function bindSurahPageConstraint(selectId, inputId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(inputId);
    if (!sel || !inp) return;

    sel.addEventListener("change", () => {
      window.QuranData.applyPageConstraints(sel, inp);
    });
  }

  // ==========================================================================
  // 6. تحميل وتحديث بيانات الواجهة
  // ==========================================================================
  function loadInitialData() {
    renderDailySessions();
    renderStudentsList();
    updateLiveStats();
  }

  function renderDailySessions() {
    const session = window.storageManager.getSessionForDate(state.today);

    // بطاقة التلقين
    const talqeenSurahEl = document.getElementById("talqeenSurahDisplay");
    const talqeenPageEl = document.getElementById("talqeenPageDisplay");
    if (talqeenSurahEl && talqeenPageEl) {
      if (session.surahName) {
        talqeenSurahEl.textContent = `سورة ${session.surahName}`;
        talqeenPageEl.innerHTML = `<span>📄</span> صفحة: ${session.pageNumber || "1"} في المصحف الشريف`;
      } else {
        talqeenSurahEl.textContent = "سورة الفاتحة";
        talqeenPageEl.innerHTML = `<span>📄</span> صفحة: 1 في المصحف الشريف`;
      }
    }

    // بطاقة الوعظ
    const wadhTitleEl = document.getElementById("wadhTitleDisplay");
    const wadhPageEl = document.getElementById("wadhPageDisplay");
    if (wadhTitleEl && wadhPageEl) {
      if (session.lessonTitle) {
        wadhTitleEl.textContent = session.lessonTitle;
        wadhPageEl.innerHTML = `<span>📌</span> المرجع / الصفحة: ${session.lessonPage || "غير محدد"}`;
      } else {
        wadhTitleEl.textContent = "فضل تدبر القرآن والعمل به";
        wadhPageEl.innerHTML = `<span>📌</span> المرجع / الصفحة: غير محدد`;
      }
    }
  }

  function updateLiveStats() {
    const students = window.storageManager.getStudents();
    const attendance = window.storageManager.getAttendanceForDate(state.today);
    const absentSet = new Set(attendance.absentStudentIds || []);

    let presentCount = 0;
    let absentCount = 0;
    let pendingRecitationCount = 0;

    students.forEach(student => {
      const isAbsent = absentSet.has(student.id);
      if (isAbsent) {
        absentCount++;
      } else {
        presentCount++;
        const hasRecitedToday = Array.isArray(student.dailyLogs) && student.dailyLogs.some(l => l.date === state.today && !l.isAbsent && (l.memoFromSurah || l.revFromSurah));
        if (!hasRecitedToday) {
          pendingRecitationCount++;
        }
      }
    });

    const elTotal = document.getElementById("statTotalStudents");
    const elPresent = document.getElementById("statPresentStudents");
    const elAbsent = document.getElementById("statAbsentStudents");
    const elPending = document.getElementById("statPendingRecitation");

    if (elTotal) elTotal.textContent = students.length;
    if (elPresent) elPresent.textContent = presentCount;
    if (elAbsent) elAbsent.textContent = absentCount;
    if (elPending) elPending.textContent = pendingRecitationCount;
  }

  // ==========================================================================
  // 7. عرض قائمة الطلاب والبطاقات
  // ==========================================================================
  function renderStudentsList() {
    const container = document.getElementById("studentsContainer");
    if (!container) return;

    const allStudents = window.storageManager.getStudents();
    const attendance = window.storageManager.getAttendanceForDate(state.today);
    const absentSet = new Set(attendance.absentStudentIds || []);

    if (allStudents.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📖</div>
          <h3>مرحباً بك في نظام «إِتْقَانْ»</h3>
          <p>
            حلقة القرآن الكريم فارغة حالياً. ابدأ بإضافة طلابك وتوثيق حضورهم وحفظهم اليومي بكل يسر وسهولة.
          </p>
          <button id="btnEmptyStateAddStudent" class="btn-primary">
            <span>➕</span> إضافة أول طالب في الحلقة
          </button>
        </div>
      `;
      const btn = document.getElementById("btnEmptyStateAddStudent");
      if (btn) {
        btn.addEventListener("click", () => openStudentModal());
      }
      return;
    }

    const query = state.searchQuery.trim().toLowerCase();
    const filteredStudents = allStudents.filter(student => {
      const nameMatch = !query || (student.name && student.name.toLowerCase().includes(query));
      if (!nameMatch) return false;

      const isAbsent = absentSet.has(student.id);
      const hasRecitedToday = Array.isArray(student.dailyLogs) && student.dailyLogs.some(l => l.date === state.today && !l.isAbsent && (l.memoFromSurah || l.revFromSurah));

      if (state.currentFilter === "present") return !isAbsent;
      if (state.currentFilter === "absent") return isAbsent;
      if (state.currentFilter === "pending") return !isAbsent && !hasRecitedToday;
      return true;
    });

    if (filteredStudents.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 2.5rem 1rem;">
          <div class="empty-icon" style="background: var(--bg-tertiary); color: var(--text-muted);">🔍</div>
          <h3>لا توجد نتائج مطابقة</h3>
          <p>لم يتم العثور على أي طالب يطابق معايير البحث أو الفلتر المحددة.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredStudents.map(student => {
      const isAbsent = absentSet.has(student.id);
      const hasRecitedToday = Array.isArray(student.dailyLogs) && student.dailyLogs.some(l => l.date === state.today && !l.isAbsent && (l.memoFromSurah || l.revFromSurah));

      let cardStatusClass = "is-present";
      let statusTagHtml = '<span class="status-tag tag-present">حاضر ✓</span>';

      if (isAbsent) {
        cardStatusClass = "is-absent";
        statusTagHtml = '<span class="status-tag tag-absent">غائب ✕</span>';
      } else if (!hasRecitedToday) {
        cardStatusClass = "is-pending";
        statusTagHtml = '<span class="status-tag tag-pending">لم يُسمّع بعد ⏳</span>';
      }

      const latestLog = (Array.isArray(student.dailyLogs) && student.dailyLogs.length > 0) ? student.dailyLogs[0] : null;
      let recitationSummaryHtml = '<div style="color: var(--text-muted); font-size: 0.8rem;">لا يوجد تسجيل سابق بعد</div>';

      if (latestLog) {
        const formattedLogDate = formatDateDDMMYYYY(latestLog.date);
        if (latestLog.isAbsent) {
          recitationSummaryHtml = `
            <div class="recitation-summary-line">
              <span class="summary-label">آخر تسجيل (${formattedLogDate}):</span>
              <span class="summary-value" style="color: var(--danger);">(غائب ⚠️)</span>
            </div>
          `;
        } else {
          let memoPart = "";
          let revPart = "";
          if (latestLog.memoFromSurah) {
            memoPart = `حفظ: ${latestLog.memoFromSurah} (${latestLog.memoFromPage || 1} إلى ${latestLog.memoToPage || latestLog.memoFromPage || 1})`;
          }
          if (latestLog.revFromSurah) {
            revPart = `مراجعة: ${latestLog.revFromSurah} (${latestLog.revFromPage || 1} إلى ${latestLog.revToPage || latestLog.revFromPage || 1})`;
          }
          recitationSummaryHtml = `
            <div class="recitation-summary-line">
              <span class="summary-label">آخر جلسة (${formattedLogDate}):</span>
            </div>
            ${memoPart ? `<div class="recitation-summary-line"><span class="summary-label">الحفظ:</span> <span class="summary-value">${memoPart.replace('حفظ: ', '')}</span></div>` : ''}
            ${revPart ? `<div class="recitation-summary-line"><span class="summary-label">المراجعة:</span> <span class="summary-value">${revPart.replace('مراجعة: ', '')}</span></div>` : ''}
          `;
        }
      }

      const initialChar = student.name ? student.name.trim().charAt(0) : "ط";

      return `
        <article class="student-card ${cardStatusClass}" data-student-id="${student.id}">
          <div class="student-card-header">
            <div class="student-identity">
              <div class="student-avatar">${escapeHtml(initialChar)}</div>
              <div class="student-name-box">
                <h3>${escapeHtml(student.name)}</h3>
                <div class="student-badges-row">
                  <span class="ajza-badge">الأجزاء: ${student.completedAjza || 0}</span>
                  ${statusTagHtml}
                </div>
              </div>
            </div>
          </div>

          <div class="student-summary-body">
            ${recitationSummaryHtml}
          </div>

          <div class="student-card-actions">
            <button class="btn-card-action btn-memo" data-action="memo" data-id="${student.id}" title="تسجيل حفظ ومراجعة اليوم">
              <span>📖</span> تسجيل التسميع
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  // ==========================================================================
  // 8. ملف الطالب الكامل (Student Profile Modal)
  // ==========================================================================
  function openStudentProfile(studentId) {
    const student = window.storageManager.getStudentById(studentId);
    if (!student) return;

    state.selectedStudentIdForProfile = studentId;
    const content = document.getElementById("profileModalContent");
    if (!content) return;

    const initial = student.name ? student.name.trim().charAt(0) : "ط";
    const walletLabelMap = {
      palpay: "محفظة بال باي (PalPay)",
      jawwal_pay: "محفظة جوال باي (Jawwal Pay)",
      bank: "حساب بنكي"
    };

    const cleanPhone = (student.phone || "").replace(/[^0-9]/g, "");
    let phoneDisplay = student.phone || "غير مسجل";
    let whatsappLink = "#";
    let telLink = "#";

    if (cleanPhone) {
      const normalizedNumber = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone;
      const countryCode = student.countryCode || "+970";
      const cleanCode = countryCode.replace("+", "");
      const fullInternational = `${cleanCode}${normalizedNumber}`;

      whatsappLink = `https://wa.me/${fullInternational}`;
      telLink = `tel:${countryCode}${normalizedNumber}`;
      phoneDisplay = `${countryCode} ${normalizedNumber}`;
    }

    const logs = Array.isArray(student.dailyLogs) ? student.dailyLogs : [];
    let timelineHtml = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">لا يوجد سجلات تسميع مسجلة بعد لهذا الطالب.</div>';
    if (logs.length > 0) {
      timelineHtml = `
        <div class="timeline-list">
          ${logs.map(log => {
            const formattedDate = formatDateDDMMYYYY(log.date);
            if (log.isAbsent) {
              return `
                <div class="timeline-item absent-item">
                  <div class="timeline-date">${escapeHtml(formattedDate)}</div>
                  <div class="timeline-details" style="color: var(--danger); font-weight: 700;">(غائب ⚠️) - لم يحضر الجلسة</div>
                  <button class="timeline-delete-btn" data-delete-log-id="${log.id}" title="حذف القيد">✕</button>
                </div>
              `;
            }

            let descParts = [];
            if (log.memoFromSurah) {
              const toPart = (log.memoToSurah && log.memoToSurah !== log.memoFromSurah) ? ` إلى ${log.memoToSurah}` : "";
              descParts.push(`<strong>حفظ:</strong> ${log.memoFromSurah} (ص ${log.memoFromPage || 1})${toPart ? `${toPart} (ص ${log.memoToPage || 1})` : (log.memoToPage && log.memoToPage !== log.memoFromPage ? ` إلى ص ${log.memoToPage}` : '')}`);
            }
            if (log.revFromSurah) {
              const toPart = (log.revToSurah && log.revToSurah !== log.revFromSurah) ? ` إلى ${log.revToSurah}` : "";
              descParts.push(`<strong>مراجعة:</strong> ${log.revFromSurah} (ص ${log.revFromPage || 1})${toPart ? `${toPart} (ص ${log.revToPage || 1})` : (log.revToPage && log.revToPage !== log.revFromPage ? ` إلى ص ${log.revToPage}` : '')}`);
            }

            return `
              <div class="timeline-item present-item">
                <div class="timeline-date">${escapeHtml(formattedDate)}</div>
                <div class="timeline-details">${descParts.join(" | ") || "حضور بدون تفاصيل"}</div>
                <button class="timeline-delete-btn" data-delete-log-id="${log.id}" title="حذف القيد">✕</button>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    const exams = Array.isArray(student.exams) ? student.exams : [];
    let examsHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-weight: 700; color: var(--text-main);">الاختبارات المنجزة (${exams.length}):</span>
        <button id="btnOpenAddExamModal" class="btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem; min-height: 38px;">
          <span>➕</span> اختبار جديد
        </button>
      </div>
    `;

    if (exams.length > 0) {
      examsHtml += `
        <div class="exams-grid">
          ${exams.map(e => `
            <div class="exam-card">
              <div>
                <div class="exam-title">${escapeHtml(e.examName)}</div>
                <div class="exam-result">${escapeHtml(e.result)}</div>
                ${e.notes ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">${escapeHtml(e.notes)}</div>` : ''}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.4rem;">
                <span class="exam-date">${escapeHtml(formatDateDDMMYYYY(e.date))}</span>
                <button class="timeline-delete-btn" data-delete-exam-id="${e.id}" title="حذف الاختبار">✕</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    } else {
      examsHtml += '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">لا توجد اختبارات مسجلة بعد. انقر على "اختبار جديد" لإضافة أول اختبار.</div>';
    }

    content.innerHTML = `
      <div class="profile-header-card">
        <div class="profile-avatar">${escapeHtml(initial)}</div>
        <div class="profile-name-box">
          <h2>${escapeHtml(student.name)}</h2>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.3rem;">
            <span class="ajza-badge">الأجزاء المنجزة: ${student.completedAjza || 0}</span>
            <span class="status-tag tag-present">تاريخ التسجيل: ${formatDateDDMMYYYY(student.createdAt)}</span>
          </div>
        </div>
      </div>

      <!-- بطاقة المحفظة مع زر النسخ الذكي -->
      <div class="wallet-card-container">
        <div class="wallet-details">
          <div class="wallet-icon">💳</div>
          <div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${walletLabelMap[student.walletType] || "المحفظة"}</div>
            <div class="wallet-number-text" id="walletNumberDisplay">${escapeHtml(student.walletNumber || "لا يوجد رقم مسجل")}</div>
          </div>
        </div>
        ${student.walletNumber ? `
          <button type="button" id="btnCopyWalletNumber" class="btn-copy-wallet" title="نسخ رقم المحفظة">
            <span>📋</span> نسخ الرقم
          </button>
        ` : ''}
      </div>

      <!-- أزرار التواصل المباشر -->
      <div class="contact-actions-bar">
        ${cleanPhone ? `
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="btn-contact btn-whatsapp">
            <span>💬</span> مراسلة واتساب
          </a>
          <a href="${telLink}" class="btn-contact btn-call">
            <span>📞</span> اتصال هاتف (${escapeHtml(phoneDisplay)})
          </a>
        ` : `
          <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; width: 100%; padding: 0.5rem;">
            لم يتم تسجيل رقم هاتف لهذا الطالب
          </div>
        `}
      </div>

      <!-- شبكة البيانات الشخصية -->
      <div class="profile-info-grid">
        <div class="info-tile">
          <div class="tile-label">تاريخ الميلاد:</div>
          <div class="tile-value">${escapeHtml(formatDateDDMMYYYY(student.dob) || "غير محدد")}</div>
        </div>
        <div class="info-tile">
          <div class="tile-label">رقم الهوية الوطنية:</div>
          <div class="tile-value">${escapeHtml(student.nationalId || "غير محدد")}</div>
        </div>
        <div class="info-tile">
          <div class="tile-label">رقم هوية الأب:</div>
          <div class="tile-value">${escapeHtml(student.fatherId || "غير محدد")}</div>
        </div>
        <div class="info-tile">
          <div class="tile-label">ولي الأمر / المعيل:</div>
          <div class="tile-value">${escapeHtml(student.guardianName || "غير محدد")}</div>
        </div>
        <div class="info-tile" style="grid-column: 1 / -1;">
          <div class="tile-label">مكان السكن / العنوان:</div>
          <div class="tile-value">${escapeHtml(student.residence || "غير محدد")}</div>
        </div>
      </div>

      <!-- تبويبات السجلات -->
      <div class="profile-tabs">
        <button class="profile-tab-btn active" data-profile-tab="timeline">سجل الحفظ والمراجعة</button>
        <button class="profile-tab-btn" data-profile-tab="exams">سجل الاختبارات (${exams.length})</button>
      </div>

      <div id="tabPaneTimeline" class="tab-pane active">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 0.75rem;">
          <button id="btnProfileAddRecitation" class="btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem; min-height: 38px;">
            <span>📖</span> تسجيل تسميع جديد
          </button>
        </div>
        ${timelineHtml}
      </div>

      <div id="tabPaneExams" class="tab-pane">
        ${examsHtml}
      </div>
    `;

    const copyBtn = document.getElementById("btnCopyWalletNumber");
    if (copyBtn && student.walletNumber) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(student.walletNumber).then(() => {
          showToast("تم نسخ رقم المحفظة بنجاح ✓", "success");
        }).catch(() => {
          showToast("تعذر النسخ التلقائي", "error");
        });
      });
    }

    const tabBtns = content.querySelectorAll(".profile-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.getAttribute("data-profile-tab");
        const paneTimeline = document.getElementById("tabPaneTimeline");
        const paneExams = document.getElementById("tabPaneExams");
        if (tab === "timeline") {
          paneTimeline.classList.add("active");
          paneExams.classList.remove("active");
        } else {
          paneTimeline.classList.remove("active");
          paneExams.classList.add("active");
        }
      });
    });

    const btnProfileAddRecitation = document.getElementById("btnProfileAddRecitation");
    if (btnProfileAddRecitation) {
      btnProfileAddRecitation.addEventListener("click", () => {
        closeModal("profileModal");
        openRecitationModal(studentId);
      });
    }

    const btnOpenAddExamModal = document.getElementById("btnOpenAddExamModal");
    if (btnOpenAddExamModal) {
      btnOpenAddExamModal.addEventListener("click", () => {
        openExamModal(studentId);
      });
    }

    content.querySelectorAll("[data-delete-log-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const logId = btn.getAttribute("data-delete-log-id");
        showConfirmDialog("حذف قيد التسميع", "هل أنت متأكد من حذف هذا السجل الزمني للتسميع؟", () => {
          window.storageManager.deleteStudentDailyLog(studentId, logId);
          showToast("تم حذف قيد التسميع", "info");
          openStudentProfile(studentId);
          renderStudentsList();
          updateLiveStats();
        });
      });
    });

    content.querySelectorAll("[data-delete-exam-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const examId = btn.getAttribute("data-delete-exam-id");
        showConfirmDialog("حذف الاختبار", "هل أنت متأكد من حذف سجل هذا الاختبار؟", () => {
          window.storageManager.deleteStudentExam(studentId, examId);
          showToast("تم حذف سجل الاختبار", "info");
          openStudentProfile(studentId);
          if (state.archiveActiveTab === "exams") renderExamsArchive();
        });
      });
    });

    openModal("profileModal");
  }

  // ==========================================================================
  // 9. إضافة وتعديل الطالب
  // ==========================================================================
  function openStudentModal(studentId = null) {
    const form = document.getElementById("studentForm");
    if (!form) return;
    form.reset();

    const titleEl = document.getElementById("studentModalTitle");
    const editIdEl = document.getElementById("studentEditId");

    if (studentId) {
      const student = window.storageManager.getStudentById(studentId);
      if (!student) return;

      if (titleEl) titleEl.innerHTML = '<span>✏️</span> تعديل بيانات الطالب';
      if (editIdEl) editIdEl.value = student.id;

      document.getElementById("studentNameInput").value = student.name || "";
      document.getElementById("studentDobInput").value = student.dob || "";
      document.getElementById("studentAjzaInput").value = student.completedAjza || 0;
      document.getElementById("studentNationalIdInput").value = student.nationalId || "";
      document.getElementById("studentFatherIdInput").value = student.fatherId || "";
      document.getElementById("studentCountryCodeSelect").value = student.countryCode || "+970";
      document.getElementById("studentPhoneInput").value = student.phone || "";
      document.getElementById("studentWalletTypeSelect").value = student.walletType || "palpay";
      document.getElementById("studentWalletNumberInput").value = student.walletNumber || "";
      document.getElementById("studentGuardianInput").value = student.guardianName || "";
      document.getElementById("studentResidenceInput").value = student.residence || "";
    } else {
      if (titleEl) titleEl.innerHTML = '<span>➕</span> إضافة طالب جديد';
      if (editIdEl) editIdEl.value = "";
      const defaultSettings = window.storageManager.getSettings();
      document.getElementById("studentCountryCodeSelect").value = defaultSettings.defaultCountryCode || "+970";
    }

    openModal("studentModal");
  }

  function handleStudentFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("studentNameInput").value.trim();
    if (!name) {
      showToast("يرجى إدخال اسم الطالب رباعي", "error");
      return;
    }

    const editId = document.getElementById("studentEditId").value;
    const studentData = {
      id: editId || undefined,
      name: name,
      dob: document.getElementById("studentDobInput").value,
      completedAjza: parseInt(document.getElementById("studentAjzaInput").value, 10) || 0,
      nationalId: document.getElementById("studentNationalIdInput").value.trim(),
      fatherId: document.getElementById("studentFatherIdInput").value.trim(),
      countryCode: document.getElementById("studentCountryCodeSelect").value,
      phone: document.getElementById("studentPhoneInput").value.trim(),
      walletType: document.getElementById("studentWalletTypeSelect").value,
      walletNumber: document.getElementById("studentWalletNumberInput").value.trim(),
      guardianName: document.getElementById("studentGuardianInput").value.trim(),
      residence: document.getElementById("studentResidenceInput").value.trim()
    };

    window.storageManager.saveStudent(studentData);
    closeModal("studentModal");
    showToast(editId ? "تم تحديث بيانات الطالب بنجاح" : "تمت إضافة الطالب للحلقة بنجاح", "success");

    renderStudentsList();
    updateLiveStats();

    if (editId && state.selectedStudentIdForProfile === editId) {
      openStudentProfile(editId);
    }
  }

  // ==========================================================================
  // 10. نافذة رصد الحفظ والمراجعة
  // ==========================================================================
  function openRecitationModal(studentId) {
    const student = window.storageManager.getStudentById(studentId);
    if (!student) return;

    const form = document.getElementById("recitationForm");
    if (!form) return;
    form.reset();

    document.getElementById("recitationStudentId").value = studentId;
    document.getElementById("recitationStudentNameBadge").textContent = `تسميع الطالب: ${student.name}`;
    
    const dateInput = document.getElementById("recitationDateInput");
    dateInput.value = state.today;

    checkRecitationAbsenceWarning(studentId, state.today);

    dateInput.onchange = () => {
      checkRecitationAbsenceWarning(studentId, dateInput.value);
    };

    ["memoFrom", "memoTo", "revFrom", "revTo"].forEach(prefix => {
      const sel = document.getElementById(`${prefix}SurahSelect`);
      const inp = document.getElementById(`${prefix}PageInput`);
      if (sel && inp) {
        sel.value = "";
        inp.value = "";
        inp.placeholder = "رقم الصفحة";
      }
    });

    openModal("recitationModal");
  }

  function checkRecitationAbsenceWarning(studentId, date) {
    const attendance = window.storageManager.getAttendanceForDate(date);
    const isAbsent = attendance.absentStudentIds && attendance.absentStudentIds.includes(studentId);
    const warnEl = document.getElementById("recitationAbsenceWarning");
    if (warnEl) {
      warnEl.style.display = isAbsent ? "inline" : "none";
    }
  }

  function handleRecitationFormSubmit(e) {
    e.preventDefault();
    const studentId = document.getElementById("recitationStudentId").value;
    const date = document.getElementById("recitationDateInput").value;

    const memoFromSurah = document.getElementById("memoFromSurahSelect").value;
    const memoFromPage = document.getElementById("memoFromPageInput").value;
    const memoToSurah = document.getElementById("memoToSurahSelect").value;
    const memoToPage = document.getElementById("memoToPageInput").value;

    const revFromSurah = document.getElementById("revFromSurahSelect").value;
    const revFromPage = document.getElementById("revFromPageInput").value;
    const revToSurah = document.getElementById("revToSurahSelect").value;
    const revToPage = document.getElementById("revToPageInput").value;

    const hasMemo = memoFromSurah || memoFromPage;
    const hasRev = revFromSurah || revFromPage;

    if (!hasMemo && !hasRev) {
      showToast("يرجى إدخال الحفظ الجديد أو المراجعة (قسم واحد على الأقل مطلوب لحفظ التسميع)", "error");
      return;
    }

    const logData = {
      date: date,
      memoFromSurah: memoFromSurah,
      memoFromPage: memoFromPage,
      memoToSurah: memoToSurah || memoFromSurah,
      memoToPage: memoToPage || memoFromPage,
      revFromSurah: revFromSurah,
      revFromPage: revFromPage,
      revToSurah: revToSurah || revFromSurah,
      revToPage: revToPage || revFromPage
    };

    window.storageManager.saveStudentDailyLog(studentId, logData);
    closeModal("recitationModal");
    showToast("تم توثيق التسميع وتحديث حالة الطالب بنجاح ✓", "success");

    renderStudentsList();
    updateLiveStats();

    if (state.selectedStudentIdForProfile === studentId) {
      openStudentProfile(studentId);
    }
  }

  // ==========================================================================
  // 11. نافذة تسجيل الحضور والغياب
  // ==========================================================================
  function openAttendanceModal(targetDate = null) {
    state.attendanceModalTargetDate = targetDate || state.today;
    const dateInput = document.getElementById("attendanceDateInput");
    if (dateInput) {
      dateInput.value = state.attendanceModalTargetDate;
    }

    loadAttendanceModalList();
    openModal("attendanceModal");
  }

  function loadAttendanceModalList() {
    const listContainer = document.getElementById("attendanceStudentsList");
    if (!listContainer) return;

    const students = window.storageManager.getStudents();
    const attendance = window.storageManager.getAttendanceForDate(state.attendanceModalTargetDate);
    state.attendanceModalSelectedAbsents = new Set(attendance.absentStudentIds || []);

    if (students.length === 0) {
      listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">لا يوجد طلاب مسجلون في الحلقة بعد.</div>';
      updateAttendanceModalCounts();
      return;
    }

    listContainer.innerHTML = students.map(student => {
      const isAbsent = state.attendanceModalSelectedAbsents.has(student.id);
      return `
        <div class="attendance-student-row ${isAbsent ? 'is-absent' : ''}" data-student-id="${student.id}">
          <span class="student-name">${escapeHtml(student.name)}</span>
          <span class="attendance-status-badge">${isAbsent ? 'غائب ✕' : 'حاضر ✓'}</span>
        </div>
      `;
    }).join("");

    listContainer.querySelectorAll(".attendance-student-row").forEach(row => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-student-id");
        if (state.attendanceModalSelectedAbsents.has(id)) {
          state.attendanceModalSelectedAbsents.delete(id);
          row.classList.remove("is-absent");
          row.querySelector(".attendance-status-badge").textContent = "حاضر ✓";
        } else {
          state.attendanceModalSelectedAbsents.add(id);
          row.classList.add("is-absent");
          row.querySelector(".attendance-status-badge").textContent = "غائب ✕";
        }
        updateAttendanceModalCounts();
      });
    });

    updateAttendanceModalCounts();
  }

  function updateAttendanceModalCounts() {
    const students = window.storageManager.getStudents();
    const absentCount = state.attendanceModalSelectedAbsents.size;
    const presentCount = Math.max(0, students.length - absentCount);

    const presEl = document.getElementById("attendanceModalPresentCount");
    const absEl = document.getElementById("attendanceModalAbsentCount");
    if (presEl) presEl.textContent = presentCount;
    if (absEl) absEl.textContent = absentCount;

    const toggleBtn = document.getElementById("btnToggleAllAttendance");
    if (toggleBtn) {
      if (absentCount === students.length && students.length > 0) {
        toggleBtn.textContent = "إلغاء تحديد الكل (الجميع حاضر)";
      } else {
        toggleBtn.textContent = "تحديد الكل كغائبين";
      }
    }
  }

  function handleSaveAttendance() {
    const date = state.attendanceModalTargetDate;
    const absentIds = Array.from(state.attendanceModalSelectedAbsents);

    window.storageManager.syncAttendance(date, absentIds);
    closeModal("attendanceModal");
    showToast(`تم حفظ وتثبيت الحضور والغياب ليوم (${formatDateDDMMYYYY(date)}) بنجاح`, "success");

    renderStudentsList();
    updateLiveStats();

    if (document.getElementById("historyViewSection").classList.contains("active")) {
      renderAttendanceArchive();
    }
  }

  // ==========================================================================
  // 12. نافذتا تعديل ورد التلقين ودرس الوعظ المنفصلتان
  // ==========================================================================
  function openTalqeenModal(targetDate = null) {
    const date = targetDate || state.today;
    const session = window.storageManager.getSessionForDate(date);
    document.getElementById("talqeenDateInput").value = date;

    const surahSel = document.getElementById("talqeenSurahSelect");
    const pageInp = document.getElementById("talqeenPageInput");
    if (surahSel && pageInp) {
      surahSel.value = session.surahName || "الفاتحة";
      pageInp.value = session.pageNumber || "1";
      window.QuranData.applyPageConstraints(surahSel, pageInp);
    }

    openModal("talqeenModal");
  }

  function handleTalqeenFormSubmit(e) {
    e.preventDefault();
    const date = document.getElementById("talqeenDateInput").value;
    const surahName = document.getElementById("talqeenSurahSelect").value;
    const pageNumber = parseInt(document.getElementById("talqeenPageInput").value, 10) || 1;

    window.storageManager.saveTalqeenForDate(date, {
      surahName: surahName,
      pageNumber: pageNumber
    });

    closeModal("talqeenModal");
    showToast(`تم تثبيت ورد التلقين ليوم (${formatDateDDMMYYYY(date)}) بنجاح ✓`, "success");
    renderDailySessions();

    if (document.getElementById("historyViewSection").classList.contains("active")) {
      renderTalqeenArchive();
      renderAttendanceArchive();
    }
  }

  function openWadhModal(targetDate = null) {
    const date = targetDate || state.today;
    const session = window.storageManager.getSessionForDate(date);
    document.getElementById("wadhDateInput").value = date;
    document.getElementById("wadhTitleInput").value = session.lessonTitle || "";
    document.getElementById("wadhPageInput").value = session.lessonPage || "";

    openModal("wadhModal");
  }

  function handleWadhFormSubmit(e) {
    e.preventDefault();
    const date = document.getElementById("wadhDateInput").value;
    const lessonTitle = document.getElementById("wadhTitleInput").value.trim();
    const lessonPage = document.getElementById("wadhPageInput").value.trim();

    window.storageManager.saveWadhForDate(date, {
      lessonTitle: lessonTitle,
      lessonPage: lessonPage
    });

    closeModal("wadhModal");
    showToast(`تم تثبيت درس الوعظ ليوم (${formatDateDDMMYYYY(date)}) بنجاح ✓`, "success");
    renderDailySessions();

    if (document.getElementById("historyViewSection").classList.contains("active")) {
      renderWadhArchive();
      renderAttendanceArchive();
    }
  }

  // ==========================================================================
  // 13. نافذة تسجيل الاختبارات
  // ==========================================================================
  function openExamModal(studentId) {
    document.getElementById("examStudentId").value = studentId;
    document.getElementById("examDateInput").value = state.today;
    document.getElementById("examNameInput").value = "";
    document.getElementById("examResultInput").value = "";
    document.getElementById("examNotesInput").value = "";

    openModal("examModal");
  }

  function handleExamFormSubmit(e) {
    e.preventDefault();
    const studentId = document.getElementById("examStudentId").value;
    const examData = {
      examName: document.getElementById("examNameInput").value.trim(),
      date: document.getElementById("examDateInput").value,
      result: document.getElementById("examResultInput").value.trim(),
      notes: document.getElementById("examNotesInput").value.trim()
    };

    window.storageManager.saveStudentExam(studentId, examData);
    closeModal("examModal");
    showToast("تم تسجيل الاختبار بنجاح ✓", "success");

    openStudentProfile(studentId);
    if (state.archiveActiveTab === "exams") renderExamsArchive();
  }

  // ==========================================================================
  // 14. مركز السجلات والأرشيف (Archive & History Tabs)
  // ==========================================================================
  function showHistoryView() {
    document.getElementById("mainRingView").style.display = "none";
    const historySec = document.getElementById("historyViewSection");
    historySec.classList.add("active");
    historySec.style.display = "block";
    document.getElementById("btnBackToRing").style.display = "inline-flex";

    switchArchiveTab(state.archiveActiveTab);
  }

  function hideHistoryView() {
    document.getElementById("historyViewSection").classList.remove("active");
    document.getElementById("historyViewSection").style.display = "none";
    document.getElementById("mainRingView").style.display = "block";
    document.getElementById("btnBackToRing").style.display = "none";
  }

  function switchArchiveTab(tabName) {
    state.archiveActiveTab = tabName;

    // تحديث أزرار التبويبات
    document.querySelectorAll(".archive-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-archive-tab") === tabName);
    });

    // تحديث شاشات التبويب
    const panes = {
      attendance: document.getElementById("archivePaneAttendance"),
      talqeen: document.getElementById("archivePaneTalqeen"),
      wadh: document.getElementById("archivePaneWadh"),
      exams: document.getElementById("archivePaneExams")
    };

    Object.keys(panes).forEach(k => {
      if (panes[k]) {
        panes[k].classList.toggle("active", k === tabName);
      }
    });

    if (tabName === "attendance") renderAttendanceArchive();
    else if (tabName === "talqeen") renderTalqeenArchive();
    else if (tabName === "wadh") renderWadhArchive();
    else if (tabName === "exams") renderExamsArchive();
  }

  // تبويب 1: سجل الأيام والحضور
  function renderAttendanceArchive() {
    const container = document.getElementById("historyDaysContainer");
    if (!container) return;

    const allDates = window.storageManager.getAllRecordedDates();
    document.getElementById("historyTotalDaysCount").textContent = allDates.length;

    let totalPresent = 0;
    let totalExpected = 0;

    allDates.forEach(d => {
      const summary = window.storageManager.getDayFullSummary(d);
      totalPresent += summary.presentCount;
      totalExpected += summary.totalStudents;
    });

    const avgRate = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;
    document.getElementById("historyAvgAttendanceRate").textContent = `${avgRate}%`;

    let filteredDates = allDates;
    if (state.historyDateQuery) {
      filteredDates = filteredDates.filter(d => d === state.historyDateQuery);
    }

    if (state.historyFilter === "has-absence") {
      filteredDates = filteredDates.filter(d => {
        const summary = window.storageManager.getDayFullSummary(d);
        return summary.absentCount > 0;
      });
    } else if (state.historyFilter === "full") {
      filteredDates = filteredDates.filter(d => {
        const summary = window.storageManager.getDayFullSummary(d);
        return summary.absentCount === 0 && summary.totalStudents > 0;
      });
    }

    if (filteredDates.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🗂️</div>
          <h3>لا توجد سجلات حضور سابقة مطابقة</h3>
          <p>لم يتم تسجيل حضور في الأيام المحددة بعد.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredDates.map(dateStr => {
      const summary = window.storageManager.getDayFullSummary(dateStr);
      const isFullAttendance = summary.absentCount === 0 && summary.totalStudents > 0;
      const badgeClass = isFullAttendance ? 'tag-present' : (summary.absentCount > 0 ? 'tag-absent' : 'tag-pending');
      const badgeText = isFullAttendance ? 'حضور كامل ✓' : (summary.absentCount > 0 ? `غياب: ${summary.absentCount}` : 'لم يرصد');

      const absentNamesList = summary.absentStudents.map(s => s.name).join("، ");

      return `
        <article class="history-day-card">
          <div>
            <div class="history-card-top">
              <span class="history-day-date">📅 ${escapeHtml(formatDateDDMMYYYY(dateStr, true))}</span>
              <span class="history-attendance-badge status-tag ${badgeClass}">${badgeText}</span>
            </div>

            <div class="history-day-content">
              <div class="content-item">
                <span style="color: var(--primary); font-weight: 700;">✨ ورد التلقين:</span>
                <span>${summary.session.surahName ? `سورة ${summary.session.surahName} (ص ${summary.session.pageNumber || 1})` : "غير مسجل"}</span>
              </div>
              <div class="content-item">
                <span style="color: var(--gold); font-weight: 700;">💡 درس الوعظ:</span>
                <span>${summary.session.lessonTitle || "غير مسجل"} ${summary.session.lessonPage ? `(${summary.session.lessonPage})` : ''}</span>
              </div>
              <div class="content-item" style="border-top: 1px dashed var(--border-color); padding-top: 0.35rem; margin-top: 0.35rem;">
                <span>👥 الحضور: <strong>${summary.presentCount}</strong> حاضر / <strong>${summary.absentCount}</strong> غائب</span>
              </div>
              ${absentNamesList ? `
                <div class="history-absent-names">
                  <span>⚠️ الغائبون: </span>${escapeHtml(absentNamesList)}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="history-card-actions">
            <button class="btn-card-action" data-edit-history-date="${dateStr}" style="flex: 1;" title="تعديل حضور هذا اليوم">
              <span>✏️</span> تعديل الحضور
            </button>
            <button class="timeline-delete-btn" data-delete-history-date="${dateStr}" title="حذف سجل هذا اليوم بالكامل">
              🗑️
            </button>
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("[data-edit-history-date]").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-edit-history-date");
        openAttendanceModal(d);
      });
    });

    container.querySelectorAll("[data-delete-history-date]").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-delete-history-date");
        showConfirmDialog("حذف سجل اليوم", `هل أنت متأكد من حذف كافة مقررات وسجلات الحضور والغياب ليوم (${formatDateDDMMYYYY(d)})؟`, () => {
          window.storageManager.deleteDayRecord(d);
          showToast(`تم حذف سجل يوم (${formatDateDDMMYYYY(d)}) بنجاح`, "info");
          renderAttendanceArchive();
          renderDailySessions();
          renderStudentsList();
          updateLiveStats();
        });
      });
    });
  }

  // تبويب 2: سجل أوراد التلقين
  function renderTalqeenArchive() {
    const container = document.getElementById("archiveTalqeenContainer");
    if (!container) return;

    const records = window.storageManager.getAllTalqeenRecords();
    if (records.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">✨</div>
          <h3>لا توجد أوراد تلقين مسجلة بعد</h3>
          <p>عند تثبيت ورد التلقين لأي يوم، سيظهر موثقاً هنا تلقائياً بترتيب زمني.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = records.map(item => `
      <article class="archive-item-card talqeen-item">
        <div>
          <div class="archive-item-top">
            <span class="archive-date-badge">📅 ${escapeHtml(formatDateDDMMYYYY(item.date, true))}</span>
            <span class="status-tag tag-present">ورد تلقين</span>
          </div>
          <div class="archive-item-title">سورة ${escapeHtml(item.surahName)}</div>
          <div class="archive-item-subtitle">📄 صفحة: <strong>${item.pageNumber || 1}</strong> في المصحف الشريف</div>
        </div>
        <div class="history-card-actions" style="margin-top: 1rem;">
          <button class="btn-card-action" data-edit-talqeen-date="${item.date}">
            <span>✏️</span> تعديل التلقين
          </button>
        </div>
      </article>
    `).join("");

    container.querySelectorAll("[data-edit-talqeen-date]").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-edit-talqeen-date");
        openTalqeenModal(d);
      });
    });
  }

  // تبويب 3: سجل دروس الوعظ والإيمان
  function renderWadhArchive() {
    const container = document.getElementById("archiveWadhContainer");
    if (!container) return;

    const allLessons = window.storageManager.getAllWadhRecords();
    const query = state.wadhSearchQuery.trim().toLowerCase();

    const filtered = allLessons.filter(lesson => {
      if (!query) return true;
      return (lesson.lessonTitle && lesson.lessonTitle.toLowerCase().includes(query)) ||
             (lesson.lessonPage && lesson.lessonPage.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">💡</div>
          <h3>لا توجد دروس وعظ مسجلة مطابقة</h3>
          <p>يمكنك تسجيل موضوع درس الوعظ اليومي ليتم توثيقه وحفظه في هذا الأرشيف.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <article class="archive-item-card wadh-item">
        <div>
          <div class="archive-item-top">
            <span class="archive-date-badge">📅 ${escapeHtml(formatDateDDMMYYYY(item.date, true))}</span>
            <span class="status-tag tag-pending">درس إيمان</span>
          </div>
          <div class="archive-item-title">${escapeHtml(item.lessonTitle)}</div>
          <div class="archive-item-subtitle">📌 المرجع / الصفحة: <strong>${escapeHtml(item.lessonPage || "غير محدد")}</strong></div>
        </div>
        <div class="history-card-actions" style="margin-top: 1rem;">
          <button class="btn-card-action" data-edit-wadh-date="${item.date}">
            <span>✏️</span> تعديل الدرس
          </button>
        </div>
      </article>
    `).join("");

    container.querySelectorAll("[data-edit-wadh-date]").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-edit-wadh-date");
        openWadhModal(d);
      });
    });
  }

  // تبويب 4: سجل الاختبارات الشامل مع فلترة الشهر والبحث
  function renderExamsArchive() {
    const container = document.getElementById("archiveExamsContainer");
    if (!container) return;

    const allExams = window.storageManager.getAllExamsRecords();
    const query = state.examArchiveSearchQuery.trim().toLowerCase();
    const monthFilter = state.examArchiveMonthFilter; // YYYY-MM

    const filtered = allExams.filter(exam => {
      // فلترة الشهر
      if (monthFilter && exam.date) {
        if (!exam.date.startsWith(monthFilter)) {
          return false;
        }
      }

      // بحث بالاسم أو الاختبار
      if (query) {
        const studentMatch = exam.studentName && exam.studentName.toLowerCase().includes(query);
        const examMatch = exam.examName && exam.examName.toLowerCase().includes(query);
        const resultMatch = exam.result && exam.result.toLowerCase().includes(query);
        if (!studentMatch && !examMatch && !resultMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🎓</div>
          <h3>لا توجد اختبارات مسجلة مطابقة</h3>
          <p>لم يتم العثور على اختبارات مسجلة في هذا الشهر أو تطابق معايير البحث.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <article class="archive-exam-row-card">
        <div class="archive-exam-header">
          <div class="archive-exam-student">👤 ${escapeHtml(item.studentName)}</div>
          <span class="archive-exam-badge">${escapeHtml(item.examName)}</span>
        </div>

        <div class="archive-exam-body">
          <div class="archive-exam-result">النتيجة: ${escapeHtml(item.result)}</div>
          ${item.notes ? `<div class="archive-exam-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        </div>

        <div class="archive-exam-footer">
          <span>📅 ${escapeHtml(formatDateDDMMYYYY(item.date, true))}</span>
          <button class="btn-card-action" style="flex: 0 0 auto; padding: 0.3rem 0.75rem; min-height: 32px; font-size: 0.78rem;" data-open-student-profile="${item.studentId}">
            ملف الطالب
          </button>
        </div>
      </article>
    `).join("");

    container.querySelectorAll("[data-open-student-profile]").forEach(btn => {
      btn.addEventListener("click", () => {
        const stdId = btn.getAttribute("data-open-student-profile");
        openStudentProfile(stdId);
      });
    });
  }

  // ==========================================================================
  // 15. النسخ الاحتياطي وأمان البيانات
  // ==========================================================================
  function checkBackupAlert() {
    const status = window.storageManager.checkBackupReminder();
    const banner = document.getElementById("backupReminderBanner");
    const msg = document.getElementById("backupReminderMsg");

    if (banner && status.shouldRemind) {
      banner.style.display = "flex";
      if (status.neverBackedUp) {
        msg.textContent = "تنبيه مهم: لم تقم بتصدير نسخة احتياطية للحلقة بعد! يُرجى تصدير نسخة لحفظ إنجازات الطلاب.";
      } else {
        msg.textContent = `تذكير دوري: مرت ${status.days} يوماً منذ آخر نسخة احتياطية للحلقة. حمّل نسخة جديدة لسلامة البيانات.`;
      }
    }
  }

  function handleExportBackup() {
    window.storageManager.exportDataAsJSON();
    showToast("تم تنزيل ملف النسخة الاحتياطية بنجاح ✓", "success");
    const banner = document.getElementById("backupReminderBanner");
    if (banner) banner.style.display = "none";
  }

  function handleImportBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const jsonStr = e.target.result;
      const res = window.storageManager.importDataFromJSON(jsonStr);
      if (res.success) {
        showToast(`تمت استعادة البيانات بنجاح (${res.studentsCount} طالب)`, "success");
        closeModal("backupModal");
        loadInitialData();
      } else {
        showToast(res.error || "فشل استيراد الملف", "error");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  // ==========================================================================
  // 16. النوافذ المنبثقة والإشعارات
  // ==========================================================================
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove("active");
      if (!document.querySelector(".modal-backdrop.active")) {
        document.body.style.overflow = "";
      }
    }
  }

  function showConfirmDialog(title, message, onConfirm) {
    document.getElementById("confirmModalTitle").innerHTML = `<span>⚠️</span> ${escapeHtml(title)}`;
    document.getElementById("confirmModalMessage").textContent = message;
    state.confirmCallback = onConfirm;
    openModal("confirmModal");
  }

  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠️",
      info: "ℹ️"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || "✓"}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================================
  // 17. ربط الأحداث العامة (Event Listeners)
  // ==========================================================================
  function bindEvents() {
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close-modal");
        closeModal(modalId);
      });
    });

    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", e => {
        if (e.target === backdrop) {
          closeModal(backdrop.id);
        }
      });
    });

    window.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-backdrop.active").forEach(m => closeModal(m.id));
      }
    });

    document.getElementById("viewModeFullBtn").addEventListener("click", () => applyViewMode("full"));
    document.getElementById("viewModeCompactBtn").addEventListener("click", () => applyViewMode("compact"));

    document.querySelectorAll(".filter-pill[data-filter]").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill[data-filter]").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.currentFilter = pill.getAttribute("data-filter");
        renderStudentsList();
      });
    });

    const searchInput = document.getElementById("studentSearchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    searchInput.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      clearSearchBtn.classList.toggle("visible", !!state.searchQuery);
      renderStudentsList();
    });

    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.searchQuery = "";
      clearSearchBtn.classList.remove("visible");
      renderStudentsList();
      searchInput.focus();
    });

    // الإجراءات السريعة
    document.getElementById("btnOpenAddStudentModal").addEventListener("click", () => openStudentModal());
    document.getElementById("btnOpenAttendanceModal").addEventListener("click", () => openAttendanceModal());
    document.getElementById("btnOpenHistoryView").addEventListener("click", showHistoryView);
    document.getElementById("btnBackToRing").addEventListener("click", hideHistoryView);
    document.getElementById("btnBackFromHistory").addEventListener("click", hideHistoryView);
    document.getElementById("btnOpenBackupModal").addEventListener("click", () => openModal("backupModal"));

    // تعديل المقررات المنفصلة
    document.getElementById("btnEditTalqeen").addEventListener("click", () => openTalqeenModal());
    document.getElementById("btnEditWadh").addEventListener("click", () => openWadhModal());

    // النماذج
    document.getElementById("studentForm").addEventListener("submit", handleStudentFormSubmit);
    document.getElementById("recitationForm").addEventListener("submit", handleRecitationFormSubmit);
    document.getElementById("talqeenForm").addEventListener("submit", handleTalqeenFormSubmit);
    document.getElementById("wadhForm").addEventListener("submit", handleWadhFormSubmit);
    document.getElementById("examForm").addEventListener("submit", handleExamFormSubmit);

    // إجراءات الحضور
    document.getElementById("btnSaveAttendance").addEventListener("click", handleSaveAttendance);
    document.getElementById("btnResetAttendanceDateToToday").addEventListener("click", () => {
      state.attendanceModalTargetDate = state.today;
      document.getElementById("attendanceDateInput").value = state.today;
      loadAttendanceModalList();
    });

    document.getElementById("attendanceDateInput").addEventListener("change", e => {
      state.attendanceModalTargetDate = e.target.value || state.today;
      loadAttendanceModalList();
    });

    document.getElementById("btnToggleAllAttendance").addEventListener("click", () => {
      const students = window.storageManager.getStudents();
      if (state.attendanceModalSelectedAbsents.size === students.length) {
        state.attendanceModalSelectedAbsents.clear();
      } else {
        state.attendanceModalSelectedAbsents = new Set(students.map(s => s.id));
      }
      loadAttendanceModalList();
    });

    // بطاقة الطالب: النقر على زر التسميع يفتح نافذة التسميع، والنقر على أي مكان آخر بالبطاقة يفتح ملف الطالب
    document.getElementById("studentsContainer").addEventListener("click", e => {
      const memoBtn = e.target.closest("[data-action='memo']");
      if (memoBtn) {
        e.stopPropagation();
        const id = memoBtn.getAttribute("data-id");
        openRecitationModal(id);
        return;
      }

      const card = e.target.closest(".student-card");
      if (card) {
        const id = card.getAttribute("data-student-id");
        if (id) {
          openStudentProfile(id);
        }
      }
    });

    // إدارة الطالب من داخل الملف
    document.getElementById("btnEditStudentFromProfile").addEventListener("click", () => {
      if (state.selectedStudentIdForProfile) {
        closeModal("profileModal");
        openStudentModal(state.selectedStudentIdForProfile);
      }
    });

    document.getElementById("btnDeleteStudentFromProfile").addEventListener("click", () => {
      if (state.selectedStudentIdForProfile) {
        const student = window.storageManager.getStudentById(state.selectedStudentIdForProfile);
        const name = student ? student.name : "هذا الطالب";
        showConfirmDialog("حذف الطالب نهائياً", `هل أنت متأكد من حذف الطالب (${name}) وكافة سجلات حفظه واختباراته نهائياً من الحلقة؟`, () => {
          window.storageManager.deleteStudent(state.selectedStudentIdForProfile);
          closeModal("profileModal");
          showToast(`تم حذف الطالب (${name}) بنجاح`, "info");
          renderStudentsList();
          updateLiveStats();
        });
      }
    });

    document.getElementById("btnConfirmAction").addEventListener("click", () => {
      if (typeof state.confirmCallback === "function") {
        state.confirmCallback();
        state.confirmCallback = null;
      }
      closeModal("confirmModal");
    });

    // النسخ الاحتياطي
    document.getElementById("btnExportJson").addEventListener("click", handleExportBackup);
    document.getElementById("btnQuickBackup").addEventListener("click", handleExportBackup);
    document.getElementById("btnDismissBackupReminder").addEventListener("click", () => {
      document.getElementById("backupReminderBanner").style.display = "none";
    });

    const fileInput = document.getElementById("importJsonFileInput");
    document.getElementById("btnTriggerImportFile").addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", e => {
      if (e.target.files && e.target.files[0]) {
        handleImportBackupFile(e.target.files[0]);
        e.target.value = "";
      }
    });

    document.getElementById("btnResetAllData").addEventListener("click", () => {
      showConfirmDialog("إعادة ضبط المصنع بالكامل", "تحذير شديد: سيتم مسح كافة بيانات الطلاب والحضور والمقررات فورياً والبدء من جديد. هل أنت متأكد تماماً؟", () => {
        window.storageManager.resetAllData();
        closeModal("backupModal");
        showToast("تمت إعادة ضبط الحلقة ومسح البيانات", "info");
        loadInitialData();
      });
    });

    // تبويبات مركز الأرشيف
    document.querySelectorAll(".archive-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-archive-tab");
        switchArchiveTab(tab);
      });
    });

    // فلاتر سجل الحضور
    document.querySelectorAll(".filter-pill[data-history-filter]").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill[data-history-filter]").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.historyFilter = pill.getAttribute("data-history-filter");
        renderAttendanceArchive();
      });
    });

    const historyDateInput = document.getElementById("historyDateFilter");
    historyDateInput.addEventListener("change", e => {
      state.historyDateQuery = e.target.value;
      renderAttendanceArchive();
    });

    document.getElementById("btnClearHistoryDate").addEventListener("click", () => {
      historyDateInput.value = "";
      state.historyDateQuery = "";
      renderAttendanceArchive();
    });

    // بحث دروس الوعظ
    const wadhSearchInput = document.getElementById("wadhSearchInput");
    if (wadhSearchInput) {
      wadhSearchInput.addEventListener("input", e => {
        state.wadhSearchQuery = e.target.value;
        renderWadhArchive();
      });
    }

    // بحث وفلترة سجل الاختبارات الشامل
    const examArchiveSearchInput = document.getElementById("examArchiveSearchInput");
    if (examArchiveSearchInput) {
      examArchiveSearchInput.addEventListener("input", e => {
        state.examArchiveSearchQuery = e.target.value;
        renderExamsArchive();
      });
    }

    const examArchiveMonthFilter = document.getElementById("examArchiveMonthFilter");
    if (examArchiveMonthFilter) {
      examArchiveMonthFilter.addEventListener("change", e => {
        state.examArchiveMonthFilter = e.target.value;
        renderExamsArchive();
      });
    }

    const btnClearExamMonthFilter = document.getElementById("btnClearExamMonthFilter");
    if (btnClearExamMonthFilter) {
      btnClearExamMonthFilter.addEventListener("click", () => {
        if (examArchiveMonthFilter) examArchiveMonthFilter.value = "";
        state.examArchiveMonthFilter = "";
        renderExamsArchive();
      });
    }
  }
});
