import React, { useState, useEffect, useRef } from 'react';

export default function App() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [currentTab, setCurrentTab] = useState('surahs');
    const [surahs, setSurahs] = useState<any[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [surahDetails, setSurahDetails] = useState<any>(null);
    const [loadingSurahs, setLoadingSurahs] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentAudio, setCurrentAudio] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const reciters = [
        { id: 1, name: 'المنشاوي (مجوّد)', server: 'https://www.islamweb.net/audio/listen.php?audioid=141&type=mp3' },
        { id: 2, name: 'عبد الباسط عبد الصمد', server: 'https://www.islamweb.net/audio/listen.php?audioid=33&type=mp3' },
        { id: 3, name: 'محمود خليل الحصري', server: 'https://www.islamweb.net/audio/listen.php?audioid=51&type=mp3' },
        { id: 4, name: 'ماهر المعيقلي', server: 'https://www.islamweb.net/audio/listen.php?audioid=184&type=mp3' },
        { id: 5, name: 'سعد الغامدي', server: 'https://www.islamweb.net/audio/listen.php?audioid=115&type=mp3' },
    ];

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        fetchAllSurahs();
    }, []);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    const fetchAllSurahs = async () => {
        setLoadingSurahs(true);
        try {
            const res = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await res.json();
            if (data.code === 200) {
                setSurahs(data.data);
            }
        } catch (error) {
            console.error('Error fetching surahs:', error);
        } finally {
            setLoadingSurahs(false);
        }
    };

    const fetchSurahDetails = async (surahNumber: number) => {
        setLoadingDetails(true);
        try {
            const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
            const data = await res.json();
            if (data.code === 200) {
                setSurahDetails(data.data);
                setSelectedSurah(surahNumber);
            }
        } catch (error) {
            console.error('Error fetching surah details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const playReciterAudio = (reciter: any) => {
        if (currentAudio?.id === reciter.id) {
            if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else if (audioRef.current) {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setCurrentAudio(reciter);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = reciter.server;
                audioRef.current.play();
            }
        }
    };

    const filteredSurahs = surahs.filter(s => 
        s.name.includes(searchQuery) || 
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.number).includes(searchQuery)
    );

    return (
        <div className="app" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #eaeaea' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => { setSelectedSurah(null); setCurrentTab('surahs'); }}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'surahs' ? '#10B981' : 'transparent', color: currentTab === 'surahs' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📖 المصحف الشريف
                    </button>
                    <button 
                        onClick={() => setCurrentTab('audio')}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'audio' ? '#10B981' : 'transparent', color: currentTab === 'audio' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🎧 التلاوات الصوتية
                    </button>
                </div>
                <button 
                    onClick={toggleTheme}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
                >
                    {theme === 'dark' ? '☀️ الفاتح' : '🌙 الداكن'}
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#10B981' }}>القرآن الكريم وتلاواته</h1>
                <p style={{ opacity: '0.7', fontSize: '14px' }}>اقرأ واستمع إلى كتاب الله عز وجل بكل سهولة ويسر</p>
            </div>

            {currentAudio && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{isPlaying ? '🔊' : '⏸️'}</span>
                        <div>
                            <div style={{ fontSize: '12px', opacity: '0.7' }}>{isPlaying ? 'جاري الاستماع إلى:' : 'متوقف مؤقتاً:'}</div>
                            <strong>{currentAudio.name}</strong>
                        </div>
                    </div>
                    <button 
                        onClick={() => playReciterAudio(currentAudio)}
                        style={{ padding: '6px 14px', borderRadius: '6px', background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                        {isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    </button>
                </div>
            )}

            {currentTab === 'surahs' && !selectedSurah && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="text"
                            placeholder="ابحث عن اسم السورة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ccc', background: 'transparent', color: 'inherit', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                    {loadingSurahs ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>⏳ جاري تحميل السور...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                            {filteredSurahs.map(surah => (
                                <div 
                                    key={surah.number}
                                    onClick={() => fetchSurahDetails(surah.number)}
                                    style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>{surah.number}</span>
                                        <div>
                                            <strong style={{ fontSize: '16px', display: 'block' }}>{surah.name}</strong>
                                            <span style={{ fontSize: '11px', opacity: '0.6' }}>{surah.englishName} • {surah.numberOfAyahs} آية</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', opacity: '0.5' }}>{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {currentTab === 'surahs' && selectedSurah && (
                <div>
                    <button 
                        onClick={() => setSelectedSurah(null)}
                        style={{ marginBottom: '20px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '13px' }}
                    >
                        ← العودة لقائمة السور
                    </button>

                    {loadingDetails ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>⏳ جاري تحميل الآيات...</div>
                    ) : surahDetails && (
                        <div>
                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '24px', color: '#10B981', marginBottom: '5px' }}>{surahDetails.name}</h2>
                                <p style={{ fontSize: '13px', opacity: '0.7' }}>{surahDetails.englishName} — عدد الآيات: {surahDetails.numberOfAyahs}</p>
                            </div>
                            {surahDetails.number !== 9 && (
                                <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '20px', color: '#10B981', fontWeight: 'bold' }}>
                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </div>
                            )}
                            <div style={{ lineHeight: '2.5', fontSize: '18px', textAlign: 'justify', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                {surahDetails.ayahs.map((ayah: any) => (
                                    <span key={ayah.number}>
                                        {` ${ayah.text} `}
                                        <span style={{ display: 'inline-block', fontSize: '12px', padding: '2px 6px', margin: '0 4px', borderRadius: '50%', border: '1px solid #10B981', color: '#10B981', verticalAlign: 'middle' }}>
                                            {ayah.numberInSurah}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {currentTab === 'audio' && (
                <div>
                    <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>🎙️ نخبة القراء والمشايخ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {reciters.map(reciter => (
                            <div 
                                key={reciter.id}
                                style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '22px' }}>🎧</span>
                                    <strong style={{ fontSize: '16px' }}>{reciter.name}</strong>
                                </div>
                                <button 
                                    onClick={() => playReciterAudio(reciter)}
                                    style={{ padding: '8px 16px', borderRadius: '8px', background: currentAudio?.id === reciter.id && isPlaying ? '#EF4444' : '#10B981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    {currentAudio?.id === reciter.id && isPlaying ? '⏸️ إيقاف' : '▶️ استماع'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <footer style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eaeaea', opacity: '0.6', fontSize: '12px' }}>
                📖 موقع القرآن الكريم — صدقة جارية إن شاء الله
            </footer>
        </div>
    );
}
