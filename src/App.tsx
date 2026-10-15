import { useState, useEffect, useRef } from "react";
import "./App.css";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
  page?: number;
};

type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
};

type SurahDetails = Surah & {
  ayahs: Ayah[];
};

type Reciter = {
  id: number;
  name: string;
  server: string;
};

type DhikrItem = {
  id: number;
  title: string;
  text: string;
  maxCount: number;
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<"surahs" | "audio" | "adhkar">("surahs");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahDetails, setSurahDetails] = useState<SurahDetails | null>(null);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // وضع العرض في المصحف: نص أو صورة المصحف
  const [readerMode, setReaderMode] = useState<"text" | "image">("text");

  const [currentAudio, setCurrentAudio] = useState<Reciter | null>(null);
  const [selectedAudioSurah, setSelectedAudioSurah] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // حالات عدادات الأذكار
  const [dhikrCounts, setDhikrCounts] = useState<{ [key: number]: number }>({
    1: 3,
    2: 3,
    3: 100,
    4: 1,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const reciters: Reciter[] = [
    { id: 1, name: "مشاري العفاسي", server: "https://server8.mp3quran.net/afs/" },
    { id: 2, name: "عبد الباسط عبد الصمد", server: "https://server7.mp3quran.net/basit/" },
    { id: 3, name: "محمود خليل الحصري", server: "https://server13.mp3quran.net/husr/" },
    { id: 4, name: "ماهر المعيقلي", server: "https://server11.mp3quran.net/maher/" },
    { id: 5, name: "محمد صديق المنشاوي", server: "https://server10.mp3quran.net/minsh/" },
  ];

  const adhkarList: DhikrItem[] = [
    { id: 1, title: "أذكار الصباح والمساء", text: "رضيت بالله رباً، وبالإسلام ديناً، وبمحمد صلى الله عليه وسلم نبياً.", maxCount: 3 },
    { id: 2, title: "دعاء الاستعاذة", text: "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وغلبة الدين وقهر الرجال.", maxCount: 3 },
    { id: 3, title: "التسبيح والتحميد", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ العَظِيمِ.", maxCount: 100 },
    { id: 4, title: "سيد الاستغفار", text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت...", maxCount: 1 },
  ];

  const handleDhikrClick = (id: number) => {
    setDhikrCounts((prev) => {
      const current = prev[id] ?? 0;
      if (current > 0) {
        return { ...prev, [id]: current - 1 };
      }
      return prev;
    });
  };

  const resetDhikr = (id: number, max: number) => {
    setDhikrCounts((prev) => ({ ...prev, [id]: max }));
  };

  useEffect(() => {
    fetchAllSurahs();
  }, []);

  async function fetchAllSurahs() {
    setLoadingSurahs(true);
    setError("");
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      if (!response.ok) throw new Error("تعذر الاتصال بالخادم");
      const data = await response.json();
      if (data.code === 200) {
        setSurahs(data.data);
      } else {
        throw new Error("تعذر تحميل السور");
      }
    } catch {
      setError("تعذر تحميل قائمة السور. تحقق من اتصال الإنترنت.");
    } finally {
      setLoadingSurahs(false);
    }
  }

  async function fetchSurahDetails(number: number) {
    setSelectedSurah(number);
    setSurahDetails(null);
    setLoadingDetails(true);
    setError("");
    setReaderMode("text");
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
      if (!response.ok) throw new Error("تعذر تحميل السورة");
      const data = await response.json();
      if (data.code === 200) {
        setSurahDetails(data.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error("تعذر تحميل السورة");
      }
    } catch {
      setError("تعذر تحميل الآيات. حاول مرة أخرى.");
    } finally {
      setLoadingDetails(false);
    }
  }

  async function playReciterAudio(reciter: Reciter, surahNum?: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const targetSurah = surahNum || selectedAudioSurah;
    const formattedSurahNumber = String(targetSurah).padStart(3, "0");
    const audioUrl = `${reciter.server}${formattedSurahNumber}.mp3`;

    if (currentAudio?.id === reciter.id && audio.src.includes(formattedSurahNumber)) {
      if (audio.paused) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setError("تعذر تشغيل الصوت. حاول مرة أخرى.");
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    setCurrentAudio(reciter);
    if (surahNum) setSelectedAudioSurah(surahNum);
    setIsPlaying(false);
    setError("");

    audio.src = audioUrl;
    audio.load();
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError("تعذر تشغيل التلاوة. تأكد من اتصال الإنترنت.");
    }
  }

  const playNextReciter = () => {
    if (!currentAudio) return;
    const currentIndex = reciters.findIndex((r) => r.id === currentAudio.id);
    const nextIndex = (currentIndex + 1) % reciters.length;
    playReciterAudio(reciters[nextIndex], selectedAudioSurah);
  };

  const playPrevReciter = () => {
    if (!currentAudio) return;
    const currentIndex = reciters.findIndex((r) => r.id === currentAudio.id);
    const prevIndex = (currentIndex - 1 + reciters.length) % reciters.length;
    playReciterAudio(reciters[prevIndex], selectedAudioSurah);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const filteredSurahs = surahs.filter((surah) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      surah.name.includes(searchQuery.trim()) ||
      surah.englishName.toLowerCase().includes(query) ||
      String(surah.number).includes(query)
    );
  });

  const activeSurahName = surahs.find(s => s.number === selectedAudioSurah)?.name || "الفاتحة";

  // حساب الآية الحالية المضغوطة/المضللة أثناء التشغيل الصوتي بناءً على التقدم الزمني
  const activeAyahIndex = surahDetails && duration > 0 
    ? Math.min(
        Math.floor((currentTime / duration) * surahDetails.ayahs.length),
        surahDetails.ayahs.length - 1
      )
    : -1;

  return (
    <div className="app" dir="rtl">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />

      <header className="topbar">
        <a
          href="#home"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            setCurrentTab("surahs");
            setSelectedSurah(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-icon">۞</span>
          <span>
            <strong>نور القرآن</strong>
            <small>رفيقك إلى الطمأنينة</small>
          </span>
        </a>
        <nav className="desktop-nav">
          <button
            className={currentTab === "surahs" ? "nav-link active" : "nav-link"}
            onClick={() => {
              setCurrentTab("surahs");
              setSelectedSurah(null);
            }}
          >
            المصحف الشريف
          </button>
          <button
            className={currentTab === "audio" ? "nav-link active" : "nav-link"}
            onClick={() => setCurrentTab("audio")}
          >
            التلاوات الصوتية
          </button>
          <button
            className={currentTab === "adhkar" ? "nav-link active" : "nav-link"}
            onClick={() => setCurrentTab("adhkar")}
          >
            حصن المسلم (الأذكار)
          </button>
        </nav>
        <span className="topbar-decoration">﷽</span>
      </header>

      <main className="main-content" id="home">
        {/* صفحة المصحف الشريف */}
        {currentTab === "surahs" && selectedSurah === null && (
          <>
            <section className="hero">
              <div className="hero-pattern">۞</div>
              <div className="hero-content">
                <span className="hero-label"> ✦ القرآن الكريم </span>
                <h1>
                  اطمئن قلبك <br /> <span>بذكر الله</span>
                </h1>
                <p>
                  اقرأ آيات الله بتدبر، واستمع إلى أعذب التلاوات <br className="desktop-break" /> واجعل للقرآن نصيبًا من يومك.
                </p>
                <button
                  className="hero-button"
                  onClick={() =>
                    document.getElementById("surah-list")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <span>۞</span> ابدأ القراءة <span>←</span>
                </button>
              </div>
              <div className="hero-ornament">
                <div className="ornament-inner">
                  <span className="ornament-star">✦</span>
                  <span className="ornament-bismillah">﷽</span>
                  <span className="ornament-caption"> كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ </span>
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">📖</span>
                <div>
                  <strong>114</strong> <span>سورة كريمة</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✨</span>
                <div>
                  <strong>6236</strong> <span>آية قرآنية تقريبًا</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎧</span>
                <div>
                  <strong>5</strong> <span>من القراء المميزين</span>
                </div>
              </div>
            </section>

            <section className="section" id="surah-list">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow"> كَلَامُ اللهِ </span>
                  <h2>المصحف الشريف</h2>
                  <p> اختر السورة التي ترغب في قراءتها </p>
                </div>
                <span className="heading-decoration">۞</span>
              </div>

              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="search"
                  placeholder="ابحث عن سورة بالاسم أو الرقم..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="البحث عن سورة"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery("")} aria-label="مسح البحث">
                    ×
                  </button>
                )}
              </div>

              {error && (
                <div className="error-message">
                  {error}
                  <button className="retry-button" onClick={() => fetchAllSurahs()}>
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {loadingSurahs ? (
                <div className="loading">
                  <span className="spinner" />
                  <p>جاري تحضير المصحف الشريف...</p>
                </div>
              ) : (
                <>
                  <div className="results-label">
                    <span>جميع السور</span>
                    <span>{filteredSurahs.length} سورة</span>
                  </div>
                  <div className="surah-grid">
                    {filteredSurahs.map((surah) => (
                      <button
                        key={surah.number}
                        className="surah-card"
                        onClick={() => fetchSurahDetails(surah.number)}
                      >
                        <span className="surah-number"> {surah.number} </span>
                        <span className="surah-info">
                          <strong>{surah.name}</strong>
                          <small>
                            {surah.numberOfAyahs} آية <span className="dot">•</span>{" "}
                            {surah.revelationType === "Meccan" ? "مكية" : "مدنية"}
                          </small>
                        </span>
                        <span className="surah-arrow">←</span>
                      </button>
                    ))}
                  </div>
                  {!filteredSurahs.length && (
                    <div className="empty-state">
                      <span>⌕</span>
                      <h3>لم نعثر على السورة</h3>
                      <p>جرب البحث باسم آخر أو برقم السورة.</p>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* عرض تفاصيل الآيات والسورة مع ميزة عرض صورة المصحف وتشغيل الصوت والتظليل */}
        {currentTab === "surahs" && selectedSurah !== null && (
          <section className="reader-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <button
                className="back-button"
                onClick={() => {
                  setSelectedSurah(null);
                  setSurahDetails(null);
                  setError("");
                }}
                style={{ margin: 0 }}
              >
                → العودة إلى قائمة السور
              </button>

              {/* أزرار التبديل بين عرض النص وعرض صورة المصحف */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setReaderMode("text")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    background: readerMode === "text" ? "#10B981" : "#1e1e1e",
                    color: readerMode === "text" ? "#fff" : "#10B981",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold"
                  }}
                >
                  📖 نص الآيات
                </button>
                <button
                  onClick={() => setReaderMode("image")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    background: readerMode === "image" ? "#10B981" : "#1e1e1e",
                    color: readerMode === "image" ? "#fff" : "#10B981",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold"
                  }}
                >
                  🖼️ صورة المصحف
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
                <button className="retry-button" onClick={() => fetchSurahDetails(selectedSurah)}>
                  إعادة المحاولة
                </button>
              </div>
            )}

            {loadingDetails ? (
              <div className="loading">
                <span className="spinner" />
                <p>جاري تحميل آيات السورة...</p>
              </div>
            ) : (
              surahDetails && (
                <>
                  <div className="reader-header">
                    <span className="reader-badge"> السورة رقم {surahDetails.number} </span>
                    <div className="reader-frame">
                      <span className="frame-symbol">۞</span>
                      <h1>{surahDetails.name}</h1>
                      <p>{surahDetails.englishName}</p>
                      <div className="reader-meta">
                        <span> {surahDetails.revelationType === "Meccan" ? "مكية" : "مدنية"} </span>
                        <span>•</span>
                        <span> {surahDetails.numberOfAyahs} آية </span>
                      </div>
                    </div>
                  </div>

                  {/* زر تشغيل التلاوة الصوتية مباشرة داخل صفحة القراءة */}
                  <div style={{ background: "linear-gradient(145deg, #16221c, #111a15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "16px 20px", borderRadius: "12px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "22px" }}>🎧</span>
                      <div>
                        <strong style={{ fontSize: "14px", color: "#34D399", display: "block" }}>استمع إلى سورة {surahDetails.name}</strong>
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>اختر القارئ وابدأ الاستماع مع تظليل الآيات</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {reciters.slice(0, 3).map((reciter) => {
                        const isThisActive = currentAudio?.id === reciter.id && isPlaying && selectedAudioSurah === surahDetails.number;
                        return (
                          <button
                            key={reciter.id}
                            onClick={() => {
                              setSelectedAudioSurah(surahDetails.number);
                              playReciterAudio(reciter, surahDetails.number);
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: "1px solid #10B981",
                              background: isThisActive ? "#EF4444" : "#10B981",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {isThisActive ? `⏸️ إيقاف (${reciter.name.split(" ")[0]})` : `▶️ ${reciter.name.split(" ")[0]}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* عرض محتوى القراءة بناءً على الوضع المختار (نص أو صورة) */}
                  {readerMode === "text" ? (
                    <>
                      {surahDetails.number !== 1 && surahDetails.number !== 9 && (
                        <div className="basmala"> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ </div>
                      )}

                      <article className="quran-text">
                        {surahDetails.ayahs.map((ayah, index) => {
                          const isHighlighted = isPlaying && selectedAudioSurah === surahDetails.number && index === activeAyahIndex;
                          return (
                            <span
                              key={ayah.number}
                              className="ayah"
                              style={{
                                display: "inline",
                                padding: isHighlighted ? "4px 8px" : "0",
                                borderRadius: "6px",
                                background: isHighlighted ? "rgba(16, 185, 129, 0.25)" : "transparent",
                                borderBottom: isHighlighted ? "2px solid #10B981" : "none",
                                transition: "background 0.3s ease"
                              }}
                            >
                              {ayah.text}{" "}
                              <span className="ayah-number" title={`الآية ${ayah.numberInSurah}`}>
                                {ayah.numberInSurah}
                              </span>
                            </span>
                          );
                        })}
                      </article>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px", background: "#16221c", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <p style={{ color: "#34D399", marginBottom: "15px", fontSize: "14px" }}>
                        🖼️ صورة صفحة المصحف الشريف لسورة {surahDetails.name}
                      </p>
                      <div style={{ background: "#fdfbf7", padding: "20px", borderRadius: "8px", display: "inline-block", maxWidth: "100%" }}>
                        {/* عرض نموذج مرئي أو صورة المصحف الرسمية */}
                        <img
                          src={`https://everyayah.com/data/images/quran/${String(surahDetails.number).padStart(3, "0")}.png`}
                          alt={`سورة ${surahDetails.name}`}
                          style={{ width: "100%", maxHeight: "600px", objectFit: "contain", borderRadius: "4px" }}
                          onError={(e) => {
                            // في حال عدم توفر الصورة المباشرة يتم عرض بديل نصي إرشادي
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div style={{ color: "#333", padding: "20px", fontSize: "18px", fontFamily: "Traditional Arabic, serif" }}>
                          {surahDetails.ayahs.map(a => a.text).join(" ﴿" + a.numberInSurah + "﴾ ")}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="back-button bottom-back"
                    onClick={() => {
                      setSelectedSurah(null);
                      setSurahDetails(null);
                    }}
                    style={{ marginTop: "30px" }}
                  >
                    العودة إلى جميع السور
                  </button>
                </>
              )
            )}
          </section>
        )}

        {/* صفحة التلاوات الصوتية */}
        {currentTab === "audio" && (
          <section className="section audio-section">
            <div className="audio-hero">
              <span className="audio-hero-icon">♫</span>
              <span className="section-eyebrow"> آيَاتٌ تُتْلَى بِخُشُوع </span>
              <h1>أنصت بقلبك</h1>
              <p> استمتع بتلاوات عطرة تملأ الروح سكينة وطمأنينة. </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div style={{ 
              background: "linear-gradient(145deg, #16221c, #111a15)", 
              border: "1px solid rgba(16, 185, 129, 0.3)", 
              padding: "20px 24px", 
              borderRadius: "16px", 
              marginBottom: "30px", 
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
              display: "flex", 
              flexDirection: "column", 
              gap: "12px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "15px", color: "#34D399", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>۞</span> اختر السورة المراد الاستماع إليها:
                </label>
                <span style={{ fontSize: "12px", color: "#10B981", opacity: 0.8, background: "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                  السورة الحالية: {activeSurahName}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedAudioSurah}
                  onChange={(e) => setSelectedAudioSurah(Number(e.target.value))}
                  style={{ 
                    width: "100%", 
                    padding: "14px 18px", 
                    borderRadius: "12px", 
                    background: "#0d1411", 
                    color: "#f3f4f6", 
                    border: "1px solid rgba(16, 185, 129, 0.2)", 
                    outline: "none", 
                    fontSize: "15px", 
                    cursor: "pointer",
                    appearance: "none",
                    fontFamily: "inherit"
                  }}
                >
                  {surahs.map((surah) => (
                    <option key={surah.number} value={surah.number} style={{ background: "#121212", color: "#fff" }}>
                      {surah.number}. {surah.name} — ({surah.revelationType === "Meccan" ? "مكية" : "مدنية"} • {surah.numberOfAyahs} آية)
                    </option>
                  ))}
                </select>
                <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#34D399", pointerEvents: "none", fontSize: "12px" }}>
                  ▼
                </span>
              </div>
            </div>

            <div className="section-heading">
              <div>
                <h2>أصوات من نور</h2>
                <p>اختر قارئك المفضل واستمع إلى السورة المحددة</p>
              </div>
              <span className="heading-decoration">♫</span>
            </div>

            <div className="reciter-grid">
              {reciters.map((reciter, index) => {
                const active = currentAudio?.id === reciter.id && isPlaying;
                return (
                  <div className={`reciter-card ${active ? "reciter-active" : ""}`} key={reciter.id}>
                    <div className="reciter-top">
                      <span className="reciter-avatar"> {active ? "♫" : "۞"} </span>
                      <span className="reciter-index"> {String(index + 1).padStart(2, "0")} </span>
                    </div>
                    <h3>{reciter.name}</h3>
                    <p> {active ? `تُبث ${activeSurahName}` : "قارئ القرآن الكريم"} </p>
                    <button
                      className={`listen-button ${active ? "listen-active" : ""}`}
                      onClick={() => playReciterAudio(reciter)}
                    >
                      <span> {active ? "Ⅱ" : "▶"} </span>
                      {active ? "إيقاف مؤقت" : `استمع لـ ${activeSurahName}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* صفحة الأذكار المستقلة */}
        {currentTab === "adhkar" && (
          <section className="section" style={{ paddingTop: "10px" }}>
            <div className="section-heading">
              <div>
                <span className="section-eyebrow"> ذِكْرُ اللهِ حياةُ القُلُوبِ </span>
                <h2>حصن المسلم — الأذكار والتسبيح</h2>
                <p>اضغط على الذكر لتحديث العداد والتسبيح</p>
              </div>
              <span className="heading-decoration">📿</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "20px" }}>
              {adhkarList.map((dhikr) => {
                const current = dhikrCounts[dhikr.id] ?? dhikr.maxCount;
                return (
                  <div
                    key={dhikr.id}
                    onClick={() => handleDhikrClick(dhikr.id)}
                    style={{
                      background: "linear-gradient(145deg, #16221c, #111a15)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "14px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ color: "#34D399", fontSize: "15px" }}>{dhikr.title}</strong>
                        <span style={{ fontSize: "11px", background: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "2px 8px", borderRadius: "10px" }}>
                          المتبقي: {current}
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#e2e8f0", margin: 0 }}>
                        {dhikr.text}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>انقر للتسبيح 👆</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetDhikr(dhikr.id, dhikr.maxCount);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#34D399",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* مشغل الصوت المصغر */}
      {currentAudio && (
        <div className="mini-player" style={{ flexDirection: "column", gap: "10px", padding: "14px 18px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setCurrentAudio(null);
                  setIsPlaying(false);
                }}
                style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "50%", width: "28px", height: "28px", color: "#EF4444", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="إغلاق المشغل"
              >
                ✕
              </button>
              <button
                onClick={playPrevReciter}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "15px", padding: "2px" }}
                title="القارئ السابق"
              >
                ⏮
              </button>
              <button
                className="player-control"
                onClick={() => playReciterAudio(currentAudio, selectedAudioSurah)}
                aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                style={{ width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </button>
              <button
                onClick={playNextReciter}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "15px", padding: "2px" }}
                title="القارئ التالي"
              >
                ⏭
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left", overflow: "hidden" }}>
              <div className="player-info" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong style={{ fontSize: "13px", display: "block" }}>{currentAudio.name}</strong>
                <span style={{ fontSize: "10px", opacity: 0.8 }}>
                  {isPlaying ? `سورة ${activeSurahName}` : "متوقف مؤقتًا"}
                </span>
              </div>
              <span className="player-icon" style={{ fontSize: "18px" }}>{isPlaying ? "♫" : "♪"}</span>
            </div>

          </div>

          <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px", fontSize: "11px", opacity: 0.9 }}>
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{ flex: 1, accentColor: "#10B981", cursor: "pointer", height: "4px" }}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-symbol">۞</div>
        <h3>نور القرآن</h3>
        <p> وَاذْكُر رَّبَّكَ كَثِيرًا </p>
        <div className="footer-line" />
        <span> القرآن الكريم — صدقة جارية بإذن الله </span>
      </footer>

      {/* شريط التنقل السفلي للجوال */}
      <nav className="mobile-nav">
        <button
          className={currentTab === "surahs" ? "mobile-active" : ""}
          onClick={() => {
            setCurrentTab("surahs");
            setSelectedSurah(null);
            setSurahDetails(null);
          }}
        >
          <span>۞</span> المصحف
        </button>
        <button
          className={currentTab === "audio" ? "mobile-active" : ""}
          onClick={() => setCurrentTab("audio")}
        >
          <span>♫</span> التلاوات
        </button>
        <button
          className={currentTab === "adhkar" ? "mobile-active" : ""}
          onClick={() => setCurrentTab("adhkar")}
        >
          <span>📿</span> الأذكار
        </button>
      </nav>
    </div>
  );
}
