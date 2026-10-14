import { useState, useEffect, useRef } from "react";
import "./App.css";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<"surahs" | "audio">("surahs");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahDetails, setSurahDetails] = useState<SurahDetails | null>(null);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // حالات المشغل المطورة
  const [currentAudio, setCurrentAudio] = useState<Reciter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const reciters: Reciter[] = [
    {
      id: 1,
      name: "محمد صديق المنشاوي",
      server: "https://www.islamweb.net/audio/listen.php?audioid=141&type=mp3",
    },
    {
      id: 2,
      name: "عبد الباسط عبد الصمد",
      server: "https://www.islamweb.net/audio/listen.php?audioid=33&type=mp3",
    },
    {
      id: 3,
      name: "محمود خليل الحصري",
      server: "https://www.islamweb.net/audio/listen.php?audioid=51&type=mp3",
    },
    {
      id: 4,
      name: "ماهر المعيقلي",
      server: "https://www.islamweb.net/audio/listen.php?audioid=184&type=mp3",
    },
    {
      id: 5,
      name: "سعد الغامدي",
      server: "https://www.islamweb.net/audio/listen.php?audioid=115&type=mp3",
    },
  ];

  useEffect(() => {
    fetchAllSurahs();
  }, []);

  async function fetchAllSurahs() {
    setLoadingSurahs(true);
    setError("");
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      if (!response.ok) {
        throw new Error("تعذر الاتصال بالخادم");
      }
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
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
      if (!response.ok) {
        throw new Error("تعذر تحميل السورة");
      }
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

  async function playReciterAudio(reciter: Reciter) {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentAudio?.id === reciter.id) {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          setError("تعذر تشغيل الصوت. حاول مرة أخرى.");
        }
      } else {
        audio.pause();
      }
      return;
    }

    setCurrentAudio(reciter);
    setIsPlaying(false);
    setError("");
    audio.src = reciter.server;
    audio.load();
    try {
      await audio.play();
    } catch {
      setError("تعذر تشغيل التلاوة. قد يكون رابط الصوت غير متاح.");
    }
  }

  // التبديل للقارئ التالي
  const playNextReciter = () => {
    if (!currentAudio) return;
    const currentIndex = reciters.findIndex((r) => r.id === currentAudio.id);
    const nextIndex = (currentIndex + 1) % reciters.length;
    playReciterAudio(reciters[nextIndex]);
  };

  // التبديل للقارئ السابق
  const playPrevReciter = () => {
    if (!currentAudio) return;
    const currentIndex = reciters.findIndex((r) => r.id === currentAudio.id);
    const prevIndex = (currentIndex - 1 + reciters.length) % reciters.length;
    playReciterAudio(reciters[prevIndex]);
  };

  // التحكم بشريط التقديم (Seek)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // تنسيق الوقت (دقائق:ثواني)
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
        </nav>
        <span className="topbar-decoration">﷽</span>
      </header>

      <main className="main-content" id="home">
        {!selectedSurah && currentTab === "surahs" && (
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
                  <button
                    className="retry-button"
                    onClick={() => {
                      if (selectedSurah) {
                        fetchSurahDetails(selectedSurah);
                      } else {
                        fetchAllSurahs();
                      }
                    }}
                  >
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

        {currentTab === "surahs" && selectedSurah !== null && (
          <section className="reader-section">
            <button
              className="back-button"
              onClick={() => {
                setSelectedSurah(null);
                setSurahDetails(null);
                setError("");
              }}
            >
              → العودة إلى قائمة السور
            </button>

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

                  {surahDetails.number !== 1 && surahDetails.number !== 9 && (
                    <div className="basmala"> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ </div>
                  )}

                  <article className="quran-text">
                    {surahDetails.ayahs.map((ayah) => (
                      <span className="ayah" key={ayah.number}>
                        {ayah.text}{" "}
                        <span className="ayah-number" title={`الآية ${ayah.numberInSurah}`}>
                          {ayah.numberInSurah}
                        </span>
                      </span>
                    ))}
                  </article>

                  <button
                    className="back-button bottom-back"
                    onClick={() => {
                      setSelectedSurah(null);
                      setSurahDetails(null);
                    }}
                  >
                    العودة إلى جميع السور
                  </button>
                </>
              )
            )}
          </section>
        )}

        {currentTab === "audio" && (
          <section className="section audio-section">
            <div className="audio-hero">
              <span className="audio-hero-icon">♫</span>
              <span className="section-eyebrow"> آيَاتٌ تُتْلَى بِخُشُوع </span>
              <h1>أنصت بقلبك</h1>
              <p> استمتع بتلاوات عطرة تملأ الروح سكينة وطمأنينة. </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="section-heading">
              <div>
                <h2>أصوات من نور</h2>
                <p>اختر قارئك المفضل واستمع إلى تلاوته</p>
              </div>
              <span className="heading-decoration">♫</span>
            </div>

            <div className="reciter-grid">
              {reciters.map((reciter, index) => {
                const active = currentAudio?.id === reciter.id;
                return (
                  <div className={`reciter-card ${active ? "reciter-active" : ""}`} key={reciter.id}>
                    <div className="reciter-top">
                      <span className="reciter-avatar"> {active && isPlaying ? "♫" : "۞"} </span>
                      <span className="reciter-index"> {String(index + 1).padStart(2, "0")} </span>
                    </div>
                    <h3>{reciter.name}</h3>
                    <p> {active && isPlaying ? "تُبث التلاوة الآن" : "قارئ القرآن الكريم"} </p>
                    <button
                      className={`listen-button ${active && isPlaying ? "listen-active" : ""}`}
                      onClick={() => playReciterAudio(reciter)}
                    >
                      <span> {active && isPlaying ? "Ⅱ" : "▶"} </span>
                      {active && isPlaying ? "إيقاف مؤقت" : "استمع الآن"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* مشغل الصوت المطور والمحسّن */}
      {currentAudio && (
        <div className="mini-player" style={{ flexDirection: "column", gap: "8px", padding: "14px 20px" }}>
          <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="player-icon" style={{ fontSize: "20px" }}>{isPlaying ? "♫" : "♪"}</span>
              <div className="player-info">
                <strong style={{ fontSize: "14px" }}>{currentAudio.name}</strong>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  {isPlaying ? "جاري تشغيل التلاوة..." : "متوقف مؤقتًا"}
                </span>
              </div>
            </div>

            {/* أتحكم بالتشغيل السابق، التوقف/التشغيل، والتالي، وإغلاق المشغل */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={playPrevReciter}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px", padding: "4px" }}
                title="القارئ السابق"
              >
                ⏮
              </button>
              <button
                className="player-control"
                onClick={() => playReciterAudio(currentAudio)}
                aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </button>
              <button
                onClick={playNextReciter}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px", padding: "4px" }}
                title="القارئ التالي"
              >
                ⏭
              </button>
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setCurrentAudio(null);
                  setIsPlaying(false);
                }}
                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "4px", marginRight: "8px" }}
                title="إغلاق المشغل"
              >
                ✕
              </button>
            </div>
          </div>

          {/* شريط التقدم والوقت */}
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
      </nav>
    </div>
  );
}
